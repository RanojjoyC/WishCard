const crypto = require('crypto');
const PurchaseRequest = require('../models/PurchaseRequest');
const User = require('../models/User');
const { getRazorpayInstance, calculateDistanceKm, calculateFeeStructure } = require('../utils/helpers');
const { getBankIdFromText } = require('../config/banks');

// State machine progression rules
const VALID_TRANSITIONS = {
  REQUESTED: ['MATCHED', 'CANCELLED'],
  MATCHED: ['ESCROW_FUNDED', 'CANCELLED'],
  ESCROW_FUNDED: ['PURCHASED', 'CANCELLED', 'DISPUTED'],
  PURCHASED: ['DELIVERED_TO_HOLDER', 'DISPUTED'],
  DELIVERED_TO_HOLDER: ['HANDOFF_COMPLETED', 'DISPUTED'],
  HANDOFF_COMPLETED: ['ESCROW_RELEASED', 'DISPUTED'],
  ESCROW_RELEASED: [],
  CANCELLED: [],
  DISPUTED: ['ESCROW_RELEASED', 'CANCELLED']
};


// 1. Buyer Creates a Purchase Request
exports.createRequest = async (req, res) => {
  try {
    const {
      productTitle,
      productUrl,
      store,
      productScreenshot,
      category,
      targetCardRequirement,
      targetBank,
      originalPrice,
      discountedPrice,
      safeMeetupLocation,
      shippingAddress,
      buyerCoordinates
    } = req.body;

    if (!productTitle || !productUrl || !store || !originalPrice || !discountedPrice || !safeMeetupLocation) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: productTitle, productUrl, store, originalPrice, discountedPrice, safeMeetupLocation.'
      });
    }

    const origPrice = parseFloat(originalPrice);
    const discPrice = parseFloat(discountedPrice);

    if (isNaN(origPrice) || origPrice <= 0 || isNaN(discPrice) || discPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Prices must be positive numeric values.' });
    }

    if (discPrice > origPrice) {
      return res.status(400).json({ success: false, message: 'Discounted price cannot exceed original price.' });
    }

    // Standardized single-source fee calculation
    const { holderProfit, platformFee, totalEscrowAmount } = calculateFeeStructure(discPrice);

    const buyerUser = req.user;
    const coordinates = (buyerCoordinates && Array.isArray(buyerCoordinates) && buyerCoordinates.length === 2)
      ? buyerCoordinates
      : (buyerUser.location?.coordinates || [0, 0]);

    const bankId = getBankIdFromText(targetBank || 'HDFC');

    const newRequest = await PurchaseRequest.create({
      buyer: buyerUser._id,
      productTitle: productTitle.trim(),
      productUrl: productUrl.trim(),
      store: store.trim(),
      productScreenshot: productScreenshot || '',
      category: category ? category.trim() : 'General',
      targetCardRequirement: targetCardRequirement ? targetCardRequirement.trim() : `${bankId} Card`,
      targetBank: bankId,
      originalPrice: origPrice,
      discountedPrice: discPrice,
      holderFeePercent: 3,
      holderProfit,
      platformFee,
      totalEscrowAmount,
      safeMeetupLocation: safeMeetupLocation.trim(),

      shippingAddress: shippingAddress || {
        fullName: buyerUser.name,
        addressLine: buyerUser.location?.address || buyerUser.collegeName || '',
        city: ''
      },
      buyerLocation: {
        type: 'Point',
        coordinates,
        address: buyerUser.location?.address || buyerUser.collegeName || ''
      },
      status: 'REQUESTED'
    });

    const populated = await PurchaseRequest.findById(newRequest._id).populate('buyer', 'name email avatar collegeName location');
    res.status(201).json({ success: true, request: populated.toSafeObject(buyerUser._id, false) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Browse Requests (Filtered / Sorted by Distance & Eligibility)
// 2. Browse Requests (Focused strictly on open REQUESTED items)
exports.getAvailableRequests = async (req, res) => {
  try {
    const currentUser = req.user;
    const { bank, maxDistanceKm } = req.query;

    const query = {
      status: 'REQUESTED',
      matchedHolder: null
    };

    if (bank && bank !== 'ALL') {
      const bankId = getBankIdFromText(bank);
      query.$or = [
        { targetBank: bankId },
        { targetBank: new RegExp(bank, 'i') },
        { targetCardRequirement: new RegExp(bank, 'i') }
      ];
    }

    let items = await PurchaseRequest.find(query)
      .populate('buyer', 'name email collegeName avatar location rating trustScore')
      .sort({ createdAt: -1 })
      .limit(50);

    const userCoords = currentUser?.location?.coordinates;
    const hasValidUserCoords = Array.isArray(userCoords) && userCoords.length === 2 && (userCoords[0] !== 0 || userCoords[1] !== 0);

    const formatted = items.map(item => {
      const safe = item.toSafeObject(currentUser?._id, currentUser?.role === 'admin');
      const buyerCoords = item.buyerLocation?.coordinates;
      const hasValidBuyerCoords = Array.isArray(buyerCoords) && buyerCoords.length === 2 && (buyerCoords[0] !== 0 || buyerCoords[1] !== 0);

      if (hasValidUserCoords && hasValidBuyerCoords) {
        safe.distanceKm = calculateDistanceKm(userCoords, buyerCoords);
      } else {
        safe.distanceKm = null;
      }
      return safe;
    });

    // Optional distance filtering
    let result = formatted;
    if (maxDistanceKm) {
      const maxD = parseFloat(maxDistanceKm);
      if (!isNaN(maxD)) {
        result = result.filter(r => r.distanceKm !== null && r.distanceKm <= maxD);
      }
    }

    // Sort closest first (null distance items placed at the end)
    result.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    res.json({ success: true, count: result.length, requests: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// 3. Get Single Request Details
exports.getRequestById = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id)
      .populate('buyer', 'name email collegeName avatar location rating trustScore')
      .populate('matchedHolder', 'name email avatar collegeName location');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const currentUserId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    res.json({ success: true, request: request.toSafeObject(currentUserId, isAdmin) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Card Holder Accepts/Matches (Atomic conditional update)
exports.acceptRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'REQUESTED' || request.matchedHolder) {
      return res.status(400).json({ success: false, message: 'This slot has already been claimed or is no longer available.' });
    }

    const currentUserId = req.user._id.toString();
    const buyerId = request.buyer.toString();

    // 1. Requester cannot accept their own slot
    if (currentUserId === buyerId) {
      return res.status(400).json({
        success: false,
        message: 'Self-acceptance prohibited: You cannot accept your own purchase request.'
      });
    }

    // 2. Card requirement verification via bank identifier matching
    const reqBankId = getBankIdFromText(request.targetBank || '');
    const userCards = req.user.creditCards || [];

    const hasMatchingCard = userCards.some(card => {
      const cardBankId = getBankIdFromText(card.bankName || '');
      const cardType = (card.cardType || '').toUpperCase();
      const reqRequirement = (request.targetCardRequirement || '').toUpperCase();

      return (
        (reqBankId && cardBankId === reqBankId) ||
        (cardType && reqRequirement.includes(cardType))
      );
    });

    if (userCards.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Card required: You must have a listed ${request.targetBank} card in your profile to accept this slot.`
      });
    }

    if (!hasMatchingCard) {
      return res.status(400).json({
        success: false,
        message: `Card mismatch: This request requires a ${request.targetBank} card, but none of your listed cards match.`
      });
    }

    // Atomic race-proof match
    const updated = await PurchaseRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'REQUESTED', matchedHolder: null },
      {
        $set: {
          matchedHolder: req.user._id,
          status: 'MATCHED',
          updatedAt: new Date()
        }
      },
      { new: true }
    )
      .populate('buyer', 'name email collegeName avatar location')
      .populate('matchedHolder', 'name email avatar collegeName location');

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Slot was just taken by another peer. Please browse other available requests.'
      });
    }

    res.json({
      success: true,
      message: 'Slot claimed! Waiting for buyer to fund escrow.',
      request: updated.toSafeObject(req.user._id, req.user.role === 'admin')
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Escrow Payment Order (Razorpay) - Only allowed from MATCHED state!
exports.createEscrowPaymentOrder = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Role check: ONLY the buyer can fund escrow
    if (request.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the buyer can initiate escrow payment for this order.' });
    }

    // State machine check: Buyer can only fund after a cardholder is matched!
    if (request.status !== 'MATCHED') {
      return res.status(400).json({
        success: false,
        message: request.status === 'REQUESTED'
          ? 'Cannot fund escrow yet. Waiting for a nearby cardholder to accept your request slot first!'
          : `Cannot fund escrow for order in state ${request.status}`
      });
    }


    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(request.totalEscrowAmount * 100);

    let order;
    try {
      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${request._id.toString().slice(-10)}`,
        notes: {
          requestId: request._id.toString(),
          buyerId: req.user._id.toString()
        }
      });
    } catch (rzpErr) {
      console.warn('[Razorpay API Warning] Real order creation failed, fallback to test mock:', rzpErr.message);
      order = {
        id: `order_test_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR'
      };
    }

    request.paymentDetails.razorpayOrderId = order.id;
    await request.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: request.totalEscrowAmount,
      amountPaise: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      request: request.toSafeObject(req.user._id, false)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Confirm Escrow Payment Received with Signature Verification
exports.confirmEscrowPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Role check: Only the buyer can confirm payment
    if (request.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the buyer can confirm escrow payment.' });
    }

    if (request.status !== 'MATCHED') {
      return res.status(400).json({ success: false, message: `Invalid state transition from ${request.status} to ESCROW_FUNDED. A holder must be matched first.` });
    }

    // Signature verification if keys are provided
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Invalid Razorpay payment signature.' });
      }
    }

    request.paymentDetails.isPaidToEscrow = true;
    request.paymentDetails.razorpayPaymentId = razorpayPaymentId || `pay_sim_${Date.now()}`;
    request.paymentDetails.razorpayOrderId = razorpayOrderId || request.paymentDetails.razorpayOrderId;
    request.paymentDetails.razorpaySignature = razorpaySignature || '';
    request.paymentDetails.paidAt = new Date();
    request.status = 'ESCROW_FUNDED';
    request.updatedAt = new Date();
    await request.save();

    const updated = await PurchaseRequest.findById(request._id)
      .populate('buyer', 'name email collegeName avatar location')
      .populate('matchedHolder', 'name email avatar collegeName location');

    res.json({
      success: true,
      message: 'Escrow payment locked securely in platform vault! Cardholder notified to purchase.',
      request: updated.toSafeObject(req.user._id, false)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Holder uploads purchase proof
exports.uploadPurchaseProof = async (req, res) => {
  try {
    const { orderId, invoiceUrl, screenshotUrl } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Role check: Only the matched cardholder can upload proof
    if (!request.matchedHolder || request.matchedHolder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the matched cardholder can upload purchase proof.' });
    }

    // State machine check
    if (request.status !== 'ESCROW_FUNDED') {
      return res.status(400).json({ success: false, message: `Cannot upload proof. Current order status: ${request.status}` });
    }

    if (!orderId && !invoiceUrl && !screenshotUrl) {
      return res.status(400).json({ success: false, message: 'Order ID, invoice URL, or screenshot URL required.' });
    }

    request.purchaseProof = {
      orderId: orderId ? orderId.trim() : `ORD-${Date.now().toString().slice(-6)}`,
      invoiceUrl: invoiceUrl || '',
      screenshotUrl: screenshotUrl || '',
      uploadedAt: new Date()
    };
    request.status = 'PURCHASED';
    request.updatedAt = new Date();
    await request.save();

    const updated = await PurchaseRequest.findById(request._id)
      .populate('buyer', 'name email collegeName avatar location')
      .populate('matchedHolder', 'name email avatar collegeName location');

    res.json({
      success: true,
      message: 'Purchase proof uploaded successfully!',
      request: updated.toSafeObject(req.user._id, false)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Holder confirms package arrival
exports.confirmItemDeliveredToHolder = async (req, res) => {
  try {
    const { packagePhotoUrl, conditionNote } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Role check: Only matched cardholder
    if (!request.matchedHolder || request.matchedHolder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the matched cardholder can confirm item arrival.' });
    }

    if (request.status !== 'PURCHASED') {
      return res.status(400).json({ success: false, message: `Cannot confirm delivery. Current order status: ${request.status}` });
    }

    request.receiptProof = {
      packagePhotoUrl: packagePhotoUrl || '',
      conditionNote: conditionNote ? conditionNote.trim() : 'Package inspected and uncompromised',
      uploadedAt: new Date()
    };
    request.status = 'DELIVERED_TO_HOLDER';
    request.updatedAt = new Date();
    await request.save();

    const updated = await PurchaseRequest.findById(request._id)
      .populate('buyer', 'name email collegeName avatar location')
      .populate('matchedHolder', 'name email avatar collegeName location');

    res.json({
      success: true,
      message: 'Package arrival confirmed! Meetup ready.',
      request: updated.toSafeObject(req.user._id, false)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. In-person handoff verification with Secret OTP
// Buyer shows the OTP upon inspecting the parcel; either the holder enters it to claim payout or buyer confirms
exports.verifyHandoff = async (req, res) => {
  try {
    const { enteredCode } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const currentUserId = req.user._id.toString();
    const isBuyer = request.buyer.toString() === currentUserId;
    const isHolder = request.matchedHolder && request.matchedHolder.toString() === currentUserId;
    const isAdmin = req.user.role === 'admin';

    // Role check: Buyer, Holder, or Admin
    if (!isBuyer && !isHolder && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only deal participants can verify the physical handoff.' });
    }

    if (request.status !== 'DELIVERED_TO_HOLDER') {
      return res.status(400).json({ success: false, message: `Cannot verify handoff in status: ${request.status}` });
    }

    if (!enteredCode || enteredCode.trim() === '') {
      return res.status(400).json({ success: false, message: 'Handoff OTP is required to confirm physical receipt.' });
    }

    if (enteredCode.trim() !== request.handoffSecretOtp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect Handoff OTP code. Please check the OTP displayed on the buyer screen.' });
    }

    // Handoff successful -> Status progresses to HANDOFF_COMPLETED
    request.status = 'HANDOFF_COMPLETED';
    request.updatedAt = new Date();

    // Automatic release trigger after verified handoff
    const holder = await User.findById(request.matchedHolder);
    if (holder) {
      const payoutAmount = request.discountedPrice + request.holderProfit;
      request.paymentDetails.payoutToHolderReleased = true;
      request.paymentDetails.payoutUpiId = holder.upiId || 'holder@okaxis';
      request.paymentDetails.payoutReferenceId = `PAYOUT_REF_${Date.now()}`;
      request.paymentDetails.payoutReleasedAt = new Date();
      request.status = 'ESCROW_RELEASED';

      holder.totalOrdersCompleted = (holder.totalOrdersCompleted || 0) + 1;
      await holder.save();
    }


    await request.save();

    const updated = await PurchaseRequest.findById(request._id)
      .populate('buyer', 'name email collegeName avatar location')
      .populate('matchedHolder', 'name email avatar collegeName location');

    res.json({
      success: true,
      message: 'In-person handoff verified! Escrow payout released to cardholder.',
      request: updated.toSafeObject(req.user._id, false)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Admin / Automated Escrow Release
exports.releaseEscrowPayout = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only Admin can manually release escrow payout
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Platform admin rights required.' });
    }

    if (request.status !== 'HANDOFF_COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Payout can only be released after handoff completion. Current status: ${request.status}`
      });
    }

    const holder = await User.findById(request.matchedHolder);
    if (!holder) {
      return res.status(400).json({ success: false, message: 'No matched cardholder associated with this request.' });
    }

    const payoutAmount = request.discountedPrice + request.holderProfit;

    request.paymentDetails.payoutToHolderReleased = true;
    request.paymentDetails.payoutUpiId = holder.upiId || 'holder@bank';
    request.paymentDetails.payoutReferenceId = `ADMIN_PAYOUT_${Date.now()}`;
    request.paymentDetails.payoutReleasedAt = new Date();
    request.status = 'ESCROW_RELEASED';
    request.updatedAt = new Date();

    holder.totalOrdersCompleted = (holder.totalOrdersCompleted || 0) + 1;
    holder.trustScore = Math.min(100, (holder.trustScore || 0) + 10);
    await holder.save();
    await request.save();

    res.json({
      success: true,
      message: `₹${payoutAmount} released to holder's UPI (${holder.upiId || 'UPI'})! Platform fee ₹${request.platformFee} settled.`,
      request: request.toSafeObject(req.user._id, true),
      payoutAmount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Cancel Order Flow (Buyer or Auto-Timeout)
exports.cancelRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const currentUserId = req.user._id.toString();
    const isBuyer = request.buyer.toString() === currentUserId;
    const isHolder = request.matchedHolder && request.matchedHolder.toString() === currentUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isHolder && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this request.' });
    }

    // Cancellation restrictions
    if (['PURCHASED', 'DELIVERED_TO_HOLDER', 'HANDOFF_COMPLETED', 'ESCROW_RELEASED'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order after card purchase. Please raise a dispute instead.`
      });
    }

    request.status = 'CANCELLED';
    request.cancellationReason = reason || 'Cancelled by user';
    request.cancelledBy = req.user._id;
    request.cancelledAt = new Date();
    request.updatedAt = new Date();

    // If buyer had funded escrow before cancelling, mark refund status
    if (request.paymentDetails?.isPaidToEscrow) {
      request.paymentDetails.refundStatus = 'REFUND_PENDING';
      request.paymentDetails.refundReferenceId = `REFUND_PENDING_${Date.now()}`;
      request.paymentDetails.refundAmount = request.totalEscrowAmount;
    }

    await request.save();

    res.json({
      success: true,
      message: request.paymentDetails?.isPaidToEscrow 
        ? 'Request cancelled successfully. Escrow deposit refund is pending to buyer.' 
        : 'Request cancelled successfully.',
      request: request.toSafeObject(req.user._id, isAdmin)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Raise Dispute
exports.raiseDispute = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const currentUserId = req.user._id.toString();
    const isBuyer = request.buyer.toString() === currentUserId;
    const isHolder = request.matchedHolder && request.matchedHolder.toString() === currentUserId;

    if (!isBuyer && !isHolder) {
      return res.status(403).json({ success: false, message: 'Only participants in this transaction can raise a dispute.' });
    }

    request.status = 'DISPUTED';
    request.disputeReason = reason || 'Unresolved delivery or condition issue';
    request.disputeRaisedBy = req.user._id;
    request.disputeRaisedAt = new Date();
    request.updatedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Dispute submitted to Platform Escrow Vault. An administrator will review proof and resolve payout.',
      request: request.toSafeObject(req.user._id, false)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Submit Rating & Update User Reputation
exports.submitRating = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'ESCROW_RELEASED') {
      return res.status(400).json({ success: false, message: 'Ratings can only be submitted for completed (ESCROW_RELEASED) deals.' });
    }

    const currentUserId = req.user._id.toString();
    const isBuyer = request.buyer.toString() === currentUserId;
    const isHolder = request.matchedHolder && request.matchedHolder.toString() === currentUserId;

    if (!isBuyer && !isHolder) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only participants in this transaction can rate this deal.' });
    }

    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));

    request.ratings = request.ratings || {};
    let targetUserId = null;

    if (isBuyer) {
      if (request.ratings.buyerRating) {
        return res.status(400).json({ success: false, message: 'You have already submitted a review for this transaction.' });
      }
      request.ratings.buyerRating = numericRating;
      request.ratings.buyerReview = review ? review.trim() : '';
      targetUserId = request.matchedHolder;
    } else {
      if (request.ratings.holderRating) {
        return res.status(400).json({ success: false, message: 'You have already submitted a review for this transaction.' });
      }
      request.ratings.holderRating = numericRating;
      request.ratings.holderReview = review ? review.trim() : '';
      targetUserId = request.buyer;
    }

    await request.save();

    // Update the recipient user's average rating and ratingsCount
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        const currentCount = targetUser.ratingsCount || 0;
        const currentAvg = targetUser.rating || 0;
        const newCount = currentCount + 1;
        const newAvg = parseFloat(((currentAvg * currentCount + numericRating) / newCount).toFixed(2));

        targetUser.ratingsCount = newCount;
        targetUser.rating = newAvg;
        await targetUser.save();
      }
    }

    res.json({
      success: true,
      message: 'Rating and review submitted successfully!',
      request: request.toSafeObject(req.user._id, false)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 14. User Orders (My Requests & My Taken Slots)
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const myOrders = await PurchaseRequest.find({
      $or: [{ buyer: userId }, { matchedHolder: userId }]
    })
      .populate('buyer', 'name email collegeName avatar location rating ratingsCount')
      .populate('matchedHolder', 'name email avatar collegeName location rating ratingsCount')
      .sort({ createdAt: -1 });

    const safeOrders = myOrders.map(o => o.toSafeObject(userId, req.user.role === 'admin'));
    res.json({ success: true, orders: safeOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 15. Admin Get All Orders (All statuses for metrics & disputes)
exports.getAllAdminOrders = async (req, res) => {
  try {
    const allOrders = await PurchaseRequest.find()
      .populate('buyer', 'name email collegeName avatar location upiId')
      .populate('matchedHolder', 'name email avatar collegeName location upiId')
      .sort({ createdAt: -1 });

    const safeOrders = allOrders.map(o => o.toSafeObject(req.user._id, true));
    res.json({ success: true, count: safeOrders.length, orders: safeOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 16. Admin Dispute Resolution: Refund Buyer
exports.resolveDisputeRefundBuyer = async (req, res) => {
  try {
    const { referenceId } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'DISPUTED') {
      return res.status(400).json({ success: false, message: `Only orders in DISPUTED status can be resolved. Current status: ${request.status}` });
    }

    request.status = 'CANCELLED';
    request.cancellationReason = `Dispute resolved in favor of Buyer. Refund issued.`;
    request.paymentDetails.refundStatus = 'REFUNDED';
    request.paymentDetails.refundAmount = request.totalEscrowAmount;
    request.paymentDetails.refundReferenceId = referenceId || `REFUND_${Date.now()}`;
    request.updatedAt = new Date();

    await request.save();

    res.json({
      success: true,
      message: `Dispute resolved. ₹${request.totalEscrowAmount} refunded to buyer.`,
      request: request.toSafeObject(req.user._id, true)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 17. Admin Dispute Resolution: Pay Holder
exports.resolveDisputePayHolder = async (req, res) => {
  try {
    const { referenceId } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'DISPUTED') {
      return res.status(400).json({ success: false, message: `Only orders in DISPUTED status can be resolved. Current status: ${request.status}` });
    }

    const holder = await User.findById(request.matchedHolder);
    const payoutAmount = (request.discountedPrice || 0) + (request.holderProfit || 0);

    request.status = 'ESCROW_RELEASED';
    request.paymentDetails.payoutToHolderReleased = true;
    request.paymentDetails.payoutUpiId = holder?.upiId || 'holder@okaxis';
    request.paymentDetails.payoutReferenceId = referenceId || `PAYOUT_DISPUTE_SETTLE_${Date.now()}`;
    request.paymentDetails.payoutReleasedAt = new Date();
    request.updatedAt = new Date();

    if (holder) {
      holder.totalOrdersCompleted = (holder.totalOrdersCompleted || 0) + 1;
      await holder.save();
    }

    await request.save();

    res.json({
      success: true,
      message: `Dispute resolved. ₹${payoutAmount} payout released to cardholder.`,
      request: request.toSafeObject(req.user._id, true)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

