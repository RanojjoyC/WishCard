import React, { useState } from 'react';
import { 
  Lock, 
  CheckCircle2, 
  Upload, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle,
  MessageSquare,
  ArrowLeft,
  X,
  ExternalLink,
  Star,
  Package
} from 'lucide-react';
import api from '../api';
import EscrowTimeline from './EscrowTimeline';
import ProductThumbnail from './ProductThumbnail';

const STATUS_LABELS = {
  REQUESTED: 'Open Slot — Awaiting Cardholder',
  MATCHED: 'Cardholder Matched — Ready to Fund Escrow',
  ESCROW_FUNDED: 'Escrow Secured — Awaiting Card Purchase',
  PURCHASED: 'Order Placed — Package in Transit',
  DELIVERED_TO_HOLDER: 'Parcel Received — Ready for Campus Meetup',
  HANDOFF_COMPLETED: 'Handoff Verified — Payout Releasing',
  ESCROW_RELEASED: 'Completed & Escrow Settled',
  CANCELLED: 'Request Cancelled',
  DISPUTED: 'Dispute Under Review'
};

const OrderDetailsView = ({ request, currentUser, onUpdateOrder, onBack, onOpenChat }) => {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Separate file upload state for purchase proof (invoice/receipt) and delivery proof (package photo)
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState('');
  const [uploadingPackagePhoto, setUploadingPackagePhoto] = useState(false);
  const [uploadedPackagePhotoUrl, setUploadedPackagePhotoUrl] = useState('');

  // Rating state
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewInput, setReviewInput] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
  const buyerId = (request?.buyer?._id || request?.buyer?.id || request?.buyer || '').toString();
  const holderId = (request?.matchedHolder?._id || request?.matchedHolder?.id || request?.matchedHolder || '').toString();

  const isBuyer = Boolean(currentUserId && buyerId && currentUserId === buyerId);
  const isHolder = Boolean(currentUserId && holderId && currentUserId === holderId);
  const isAdmin = currentUser?.role === 'admin';
  const isParticipant = isBuyer || isHolder || isAdmin;

  const clearAlerts = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Upload purchase receipt
  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingReceipt(true);
      clearAlerts();
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        setUploadedReceiptUrl(res.data.url);
        setSuccessMessage('Receipt uploaded successfully!');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Receipt upload failed');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Upload package photo for delivery confirmation
  const handlePackagePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingPackagePhoto(true);
      clearAlerts();
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        setUploadedPackagePhotoUrl(res.data.url);
        setSuccessMessage('Package photo uploaded successfully!');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Package photo upload failed');
    } finally {
      setUploadingPackagePhoto(false);
    }
  };

  // 1. Escrow Payment with Razorpay Test Mode Checkout
  const handleFundEscrow = async () => {
    clearAlerts();
    try {
      setLoadingAction(true);
      const orderRes = await api.post(`/requests/${request._id}/escrow-order`);
      const { orderId, amountPaise, keyId, currency } = orderRes.data;

      // Verify Razorpay SDK is loaded
      if (typeof window.Razorpay === 'function') {
        const options = {
          key: keyId || 'rzp_test_TlV5uGSAtXOZJh',
          amount: amountPaise,
          currency: currency || 'INR',
          name: 'WishCard Escrow',
          description: `Escrow custody deposit for: ${request.productTitle}`,
          order_id: orderId.startsWith('order_test_') ? undefined : orderId,
          prefill: {
            name: currentUser?.name || 'Student Buyer',
            email: currentUser?.email || 'buyer@campus.edu',
            contact: currentUser?.phone || '9999999999'
          },
          theme: {
            color: '#1a1816'
          },
          handler: async (response) => {
            try {
              setLoadingAction(true);
              const confirmRes = await api.post(`/requests/${request._id}/escrow-confirm`, {
                razorpayOrderId: response.razorpay_order_id || orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature || ''
              });
              if (confirmRes.data?.success) {
                setSuccessMessage('Payment successful! Escrow locked in platform custody.');
                onUpdateOrder(confirmRes.data.request);
              }
            } catch (confirmErr) {
              setErrorMessage(confirmErr.response?.data?.message || 'Payment confirmation failed on server');
            } finally {
              setLoadingAction(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoadingAction(false);
              setErrorMessage('Razorpay checkout was closed without completing payment.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (failedRes) => {
          setLoadingAction(false);
          setErrorMessage(failedRes.error?.description || 'Payment failed in Razorpay test gateway.');
        });
        rzp.open();
      } else {
        // Fallback if Razorpay SDK script failed to load or is blocked
        const res = await api.post(`/requests/${request._id}/escrow-confirm`, {
          razorpayOrderId: orderId,
          razorpayPaymentId: `pay_demo_${Date.now()}`
        });
        if (res.data?.success) {
          setSuccessMessage('Escrow funded! Payment secured in custody.');
          onUpdateOrder(res.data.request);
        }
        setLoadingAction(false);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Escrow funding failed');
      setLoadingAction(false);
    }
  };

  // 2. Holder uploads purchase proof / receipt
  const handleUploadProof = async () => {
    clearAlerts();
    if (!orderIdInput.trim() && !uploadedReceiptUrl) {
      setErrorMessage('Please provide an order receipt ID or upload proof document.');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await api.post(`/requests/${request._id}/purchase-proof`, {
        orderId: orderIdInput.trim() || `ORD-${Date.now().toString().slice(-6)}`,
        invoiceUrl: uploadedReceiptUrl,
        screenshotUrl: uploadedReceiptUrl
      });
      if (res.data?.success) {
        setSuccessMessage('Purchase proof recorded!');
        onUpdateOrder(res.data.request);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit purchase proof');
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. Holder confirms item arrival / physical possession with separate package photo
  const handleConfirmItemArrival = async () => {
    clearAlerts();
    try {
      setLoadingAction(true);
      const res = await api.post(`/requests/${request._id}/confirm-delivered`, {
        packagePhotoUrl: uploadedPackagePhotoUrl || uploadedReceiptUrl,
        conditionNote: 'Package inspected and uncompromised on campus'
      });
      if (res.data?.success) {
        setSuccessMessage('Package arrival confirmed! Ready for campus meetup.');
        onUpdateOrder(res.data.request);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to confirm arrival');
    } finally {
      setLoadingAction(false);
    }
  };

  // 4. In-person handoff with Secret OTP
  const handleVerifyHandoff = async () => {
    clearAlerts();
    if (!enteredOtp || enteredOtp.trim() === '') {
      setErrorMessage('Please enter the 6-digit Handoff OTP.');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await api.post(`/requests/${request._id}/verify-handoff`, {
        enteredCode: enteredOtp.trim()
      });
      if (res.data?.success) {
        setSuccessMessage('In-person handoff verified! Payout recorded and released to cardholder.');
        onUpdateOrder(res.data.request);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'OTP verification failed');
    } finally {
      setLoadingAction(false);
    }
  };

  // 5. Cancellation
  const handleCancelOrder = async () => {
    clearAlerts();
    const reason = window.prompt('Please provide a reason for cancellation:');
    if (reason === null) return;

    try {
      setLoadingAction(true);
      const res = await api.post(`/requests/${request._id}/cancel`, { reason });
      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'Order cancelled.');
        onUpdateOrder(res.data.request);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Cancellation failed');
    } finally {
      setLoadingAction(false);
    }
  };

  // 6. Dispute submission
  const handleSubmitDispute = async () => {
    clearAlerts();
    if (!disputeReason.trim()) {
      setErrorMessage('Please state the dispute reason.');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await api.post(`/requests/${request._id}/dispute`, { reason: disputeReason.trim() });
      if (res.data?.success) {
        setSuccessMessage('Dispute submitted. Escrow payout is frozen pending administrative review.');
        setShowDisputeModal(false);
        onUpdateOrder(res.data.request);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit dispute');
    } finally {
      setLoadingAction(false);
    }
  };

  // 7. Submit Rating
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    clearAlerts();

    try {
      setSubmittingRating(true);
      const res = await api.post(`/requests/${request._id}/rate`, {
        rating: ratingInput,
        review: reviewInput
      });
      if (res.data?.success) {
        setSuccessMessage('Rating and review submitted! Thank you.');
        onUpdateOrder(res.data.request);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const netSaving = (request.originalPrice || 0) - (request.totalEscrowAmount || 0);
  const friendlyStatus = STATUS_LABELS[request.status] || request.status;

  const hasAlreadyRated = isBuyer 
    ? Boolean(request.ratings?.buyerRating) 
    : Boolean(request.ratings?.holderRating);

  return (
    <div style={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-dark)',
            padding: '8px 18px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'var(--shadow-subtle)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Cancel button: Only show to participants in early stages */}
          {isParticipant && (request.status === 'REQUESTED' || request.status === 'MATCHED' || request.status === 'ESCROW_FUNDED') && (
            <button
              onClick={handleCancelOrder}
              disabled={loadingAction}
              style={{
                background: 'var(--accent-rose-subtle)',
                color: 'var(--accent-rose)',
                border: '1px solid #fecaca',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel Request
            </button>
          )}

          {/* Raise dispute button: Only participants, only after escrow is funded/purchased/delivered, NOT on fresh REQUESTED */}
          {isParticipant && ['ESCROW_FUNDED', 'PURCHASED', 'DELIVERED_TO_HOLDER'].includes(request.status) && (
            <button
              onClick={() => setShowDisputeModal(true)}
              style={{
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                color: 'var(--accent-rose)',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Raise Dispute
            </button>
          )}

          {/* Chat button: Show only if matched */}
          {request.matchedHolder && isParticipant && (
            <button
              onClick={() => onOpenChat(request)}
              style={{
                background: 'var(--primary-ochre-subtle)',
                color: 'var(--primary-ochre)',
                border: '1px solid var(--border-light)',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <MessageSquare size={15} />
              Direct Deal Chat
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div style={{
          background: 'var(--accent-rose-subtle)',
          border: '1px solid var(--accent-rose)',
          color: 'var(--accent-rose)',
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '0.82rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          background: 'var(--accent-green-subtle)',
          border: '1px solid var(--accent-green)',
          color: 'var(--accent-green)',
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '0.82rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Escrow Pipeline Stepper */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
              Campus Escrow Protection Pipeline
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Current Status: <strong>{friendlyStatus}</strong>
            </p>
          </div>
          <span style={{
            background: request.paymentDetails?.isPaidToEscrow ? 'var(--accent-green-subtle)' : 'var(--bg-subtle)',
            color: request.paymentDetails?.isPaidToEscrow ? 'var(--accent-green)' : 'var(--text-muted)',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ShieldCheck size={14} />
            {request.paymentDetails?.isPaidToEscrow ? 'Funds Locked in Escrow' : 'Awaiting Match / Funding'}
          </span>
        </div>

        <EscrowTimeline currentStatus={request.status} />
      </div>

      {/* Main Execution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        {/* Left: Product & Action Panel */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Product Header */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <ProductThumbnail
              src={request.productScreenshot}
              alt={request.productTitle}
              width={90}
              height={90}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  color: 'var(--primary-ochre)',
                  background: 'var(--primary-ochre-subtle)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  {request.store}
                </span>
                {request.productUrl && (
                  <a
                    href={request.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--primary-ochre)',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={12} />
                    Open Product Page
                  </a>
                )}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-dark)', margin: '6px 0 2px' }}>
                {request.productTitle}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-ochre)', fontWeight: '700' }}>
                Required: {request.targetCardRequirement}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <MapPin size={13} color="var(--accent-green)" />
                Meetup: {request.safeMeetupLocation}
              </div>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--primary-ochre)" />
                Current Action Required
              </div>
              <span style={{
                background: 'var(--primary-ochre-subtle)',
                color: 'var(--primary-ochre)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: '700'
              }}>
                {friendlyStatus}
              </span>
            </div>

            {/* STAGE: REQUESTED (No cardholder matched yet) */}
            {request.status === 'REQUESTED' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
                  {isBuyer
                    ? 'Your purchase slot is open on the campus marketplace. Once a cardholder claims this slot, you will be prompted to lock funds in simulated escrow.'
                    : 'This slot is open for any eligible peer with the required card to take up.'}
                </p>
              </div>
            )}

            {/* STAGE: MATCHED -> BUYER FUNDS ESCROW */}
            {request.status === 'MATCHED' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {isBuyer
                    ? 'Cardholder matched! To safeguard the cardholder before they spend their personal card limit, deposit the discounted amount into escrow custody.'
                    : 'Awaiting buyer to lock funds into escrow custody. Do NOT place the online order until funds are secured.'}
                </p>
                {isBuyer ? (
                  <div>
                    <button
                      onClick={handleFundEscrow}
                      disabled={loadingAction}
                      style={{
                        width: '100%',
                        background: 'var(--btn-black)',
                        color: '#ffffff',
                        padding: '12px',
                        borderRadius: '999px',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Lock size={16} color="#d49b55" />
                      {loadingAction ? 'Opening Razorpay Test Gateway...' : `Pay ₹${request.totalEscrowAmount?.toLocaleString()} via Razorpay (Test Mode)`}
                    </button>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                      Opens Razorpay sandbox payment modal with test card / UPI support.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Only the buyer ({request.buyer?.name || 'requester'}) can fund this escrow.
                  </div>
                )}
              </div>
            )}

            {/* STAGE: ESCROW FUNDED -> HOLDER BUYS WITH CARD */}
            {request.status === 'ESCROW_FUNDED' && (
              <div>
                <div style={{
                  background: 'var(--accent-green-subtle)',
                  border: '1px solid var(--border-light)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  color: 'var(--accent-green)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={16} />
                  Escrow Locked! ₹{request.totalEscrowAmount?.toLocaleString()} is safe in platform custody.
                </div>

                {isHolder ? (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginBottom: '12px' }}>
                      <strong>Cardholder Action:</strong> Purchase the item on {request.store} using your credit card, then input the retailer order ID and upload receipt proof.
                    </p>
                    {uploadedReceiptUrl ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <img
                          src={uploadedReceiptUrl}
                          alt="Receipt Preview"
                          style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-green)' }}>
                            Receipt Image Ready
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Ready to submit with Order ID below
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedReceiptUrl('')}
                          style={{
                            background: 'var(--accent-red-subtle, #fee2e2)',
                            color: 'var(--accent-red, #dc2626)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Change
                        </button>
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={orderIdInput}
                        onChange={(e) => setOrderIdInput(e.target.value)}
                        placeholder="Retailer Order / Invoice ID"
                        style={{
                          flex: 1,
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.82rem'
                        }}
                      />
                      {!uploadedReceiptUrl && (
                        <label style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.78rem',
                          cursor: uploadingReceipt ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: uploadingReceipt ? 0.6 : 1
                        }}>
                          <Upload size={14} />
                          {uploadingReceipt ? 'Uploading...' : 'Upload Receipt'}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingReceipt}
                            onChange={handleReceiptUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                    <button
                      onClick={handleUploadProof}
                      disabled={loadingAction}
                      style={{
                        width: '100%',
                        background: 'var(--btn-black)',
                        color: '#ffffff',
                        padding: '12px',
                        borderRadius: '999px',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={16} color="#d49b55" />
                      {loadingAction ? 'Submitting Proof...' : 'Confirm Card Purchase & Upload Proof'}
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-body)' }}>
                    Escrow is funded. Cardholder is now placing the order on {request.store} with their credit card.
                  </p>
                )}
              </div>
            )}

            {/* STAGE: PURCHASED -> HOLDER CONFIRMS ITEM ARRIVAL WITH PACKAGE PHOTO */}
            {request.status === 'PURCHASED' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginBottom: '12px' }}>
                  The item is in transit. When the parcel arrives at your room/hostel, take a photo of the sealed package and confirm receipt to coordinate safe meetup.
                </p>

                {/* Show purchase proof thumbnail to buyer and holder */}
                {(request.purchaseProof?.screenshotUrl || request.purchaseProof?.invoiceUrl) && (
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <img
                      src={request.purchaseProof.screenshotUrl || request.purchaseProof.invoiceUrl}
                      alt="Order receipt"
                      style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-light)' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                        Uploaded Purchase Receipt
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Retailer Order: {request.purchaseProof?.orderId || 'ORD-VERIFIED'}
                      </div>
                    </div>
                  </div>
                )}

                {isHolder && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {uploadedPackagePhotoUrl ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px'
                      }}>
                        <img
                          src={uploadedPackagePhotoUrl}
                          alt="Package Preview"
                          style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-green)' }}>
                            Package Photo Uploaded
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Ready to confirm parcel received
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedPackagePhotoUrl('')}
                          style={{
                            background: 'var(--accent-red-subtle, #fee2e2)',
                            color: 'var(--accent-red, #dc2626)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{
                          flex: 1,
                          background: 'var(--bg-card)',
                          border: '1px dashed var(--border-card)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: 'var(--text-dark)',
                          cursor: uploadingPackagePhoto ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: uploadingPackagePhoto ? 0.6 : 1
                        }}>
                          <Upload size={14} />
                          {uploadingPackagePhoto ? 'Uploading Package Photo...' : 'Upload Package Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingPackagePhoto}
                            onChange={handlePackagePhotoUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    )}

                    <button
                      onClick={handleConfirmItemArrival}
                      disabled={loadingAction}
                      style={{
                        width: '100%',
                        background: 'var(--btn-black)',
                        color: '#ffffff',
                        padding: '12px',
                        borderRadius: '999px',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 size={16} color="#d49b55" />
                      {loadingAction ? 'Confirming Arrival...' : 'Confirm Parcel Received & Condition Verified'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STAGE: DELIVERED -> MEETUP & OTP HANDOFF */}
            {request.status === 'DELIVERED_TO_HOLDER' && (
              <div>
                <div style={{
                  background: 'var(--accent-amber-subtle)',
                  border: '1px solid var(--border-light)',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  fontSize: '0.78rem',
                  color: 'var(--primary-ochre)'
                }}>
                  <strong>Campus Meetup Location:</strong> {request.safeMeetupLocation}.<br />
                  Inspect the sealed parcel in person. The buyer shows the OTP to the cardholder, who enters it to claim their payout.
                </div>

                {/* Proof Thumbnails visible to buyer */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  {request.purchaseProof?.screenshotUrl && (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.72rem'
                    }}>
                      <img src={request.purchaseProof.screenshotUrl} alt="Receipt" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      <span>Receipt Proof</span>
                    </div>
                  )}
                  {request.receiptProof?.packagePhotoUrl && (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.72rem'
                    }}>
                      <img src={request.receiptProof.packagePhotoUrl} alt="Package" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      <span>Package Proof</span>
                    </div>
                  )}
                </div>

                {/* Buyer sees the OTP to show to cardholder */}
                {isBuyer && (
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    padding: '14px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Show this OTP to Cardholder at Meetup:
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '0.2em', color: 'var(--primary-ochre)', margin: '4px 0' }}>
                      {request.handoffSecretOtp || '------'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Show this only after physically inspecting the parcel condition.
                    </div>
                  </div>
                )}

                {/* Holder enters the OTP displayed by buyer */}
                {isHolder || isAdmin ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="Enter 6-digit Handoff OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        letterSpacing: '0.15em',
                        textAlign: 'center'
                      }}
                    />
                    <button
                      onClick={handleVerifyHandoff}
                      disabled={loadingAction}
                      style={{
                        background: 'var(--btn-black)',
                        color: '#ffffff',
                        padding: '10px 20px',
                        borderRadius: '999px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Confirm Handoff & Release Payout
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center'
                  }}>
                    Awaiting cardholder to enter your OTP on their screen to complete handoff and release funds.
                  </div>
                )}
              </div>
            )}

            {/* STAGE: ESCROW_RELEASED (Completed deal + Rate Form) */}
            {request.status === 'ESCROW_RELEASED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: 'var(--accent-green-subtle)',
                  border: '1px solid var(--border-light)',
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <CheckCircle2 size={32} color="var(--accent-green)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-green)' }}>
                    Deal Fully Settled & Completed!
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Cardholder received full item refund + 3% margin (simulated payout recorded).
                  </div>
                </div>

                {/* Rating Form for both Buyer and Holder */}
                {isParticipant && !hasAlreadyRated && (
                  <form onSubmit={handleSubmitRating} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                      Rate your experience with {isBuyer ? (request.matchedHolder?.name || 'Cardholder') : (request.buyer?.name || 'Buyer')}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        >
                          <Star
                            size={20}
                            fill={star <= ratingInput ? 'var(--primary-ochre)' : 'none'}
                            color="var(--primary-ochre)"
                          />
                        </button>
                      ))}
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)', marginLeft: '4px' }}>
                        {ratingInput} / 5 Stars
                      </span>
                    </div>

                    <textarea
                      rows="2"
                      placeholder="Share a brief review of the campus handoff..."
                      value={reviewInput}
                      onChange={(e) => setReviewInput(e.target.value)}
                      style={{
                        background: 'var(--bg-page)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '0.8rem',
                        width: '100%'
                      }}
                    />

                    <button
                      type="submit"
                      disabled={submittingRating}
                      style={{
                        background: 'var(--btn-black)',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        alignSelf: 'flex-start',
                        cursor: 'pointer'
                      }}
                    >
                      {submittingRating ? 'Submitting Review...' : 'Submit Rating & Review'}
                    </button>
                  </form>
                )}

                {hasAlreadyRated && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--accent-green)', fontWeight: '700', textAlign: 'center' }}>
                    ✓ You have submitted your review for this transaction.
                  </div>
                )}
              </div>
            )}

            {/* STAGE: CANCELLED */}
            {request.status === 'CANCELLED' && (
              <div style={{
                background: 'var(--accent-rose-subtle)',
                border: '1px solid var(--accent-rose)',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <AlertTriangle size={32} color="var(--accent-rose)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-rose)' }}>
                  This Request Was Cancelled
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Reason: {request.cancellationReason || 'Cancelled before execution.'}
                </div>
                {request.paymentDetails?.refundStatus && (
                  <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--accent-rose)', fontWeight: '800' }}>
                    Status: {request.paymentDetails.refundStatus === 'REFUNDED' ? 'Refund Processed' : 'Refund Pending to Buyer'}
                  </div>
                )}
              </div>
            )}

            {/* STAGE: DISPUTED */}
            {request.status === 'DISPUTED' && (
              <div style={{
                background: 'var(--accent-amber-subtle)',
                border: '1px solid var(--primary-ochre)',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <AlertTriangle size={32} color="var(--primary-ochre)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary-ochre)' }}>
                  Dispute Under Review
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginTop: '4px' }}>
                  {request.disputeReason || 'A dispute has been raised and escrow funds are frozen pending administrative review.'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Settlement Financials */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: 'fit-content'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', margin: 0 }}>
            Escrow Financial Settlement
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>Retail MRP:</span>
              <span style={{ textDecoration: 'line-through' }}>₹{request.originalPrice?.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-dark)', fontWeight: '600' }}>
              <span>Card Discounted Cost:</span>
              <span>₹{request.discountedPrice?.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--primary-ochre)', fontWeight: '700' }}>
              <span>Cardholder 3% Profit:</span>
              <span>+ ₹{request.holderProfit?.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>Platform Escrow Fee:</span>
              <span>+ ₹{request.platformFee}</span>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-light)',
              paddingTop: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.05rem',
              fontWeight: '900',
              color: 'var(--primary-ochre)'
            }}>
              <span>Total Escrow Amount:</span>
              <span>₹{request.totalEscrowAmount?.toLocaleString()}</span>
            </div>

            {netSaving > 0 && (
              <div style={{
                background: 'var(--accent-green-subtle)',
                color: 'var(--accent-green)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '800',
                textAlign: 'center'
              }}>
                You save ₹{netSaving.toLocaleString()} vs retail MRP!
              </div>
            )}

            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              padding: '10px',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.74rem',
              color: 'var(--primary-ochre)',
              fontWeight: '700',
              marginTop: '4px'
            }}>
              Cardholder Payout: ₹{(request.discountedPrice + request.holderProfit)?.toLocaleString()}
              <div style={{ fontSize: '0.68rem', fontWeight: '400', color: 'var(--text-muted)', marginTop: '2px' }}>
                Item cost refund + 3% margin via UPI payout
              </div>
            </div>
          </div>

          {/* Deal Participants */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Buyer</div>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                {request.buyer?.name || 'Peer'} {request.buyer?.collegeName ? `(${request.buyer.collegeName})` : ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Cardholder Slot</div>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                {request.matchedHolder?.name || 'Open Slot - Awaiting Match'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>Raise Deal Dispute</h3>
              <button onClick={() => setShowDisputeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Explain why this order requires dispute resolution (e.g. wrong item delivered, seller no-show, unsealed package). Escrow payout will be frozen.
            </p>
            <textarea
              rows="4"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="State the specific issue..."
              style={{
                width: '100%',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.82rem',
                marginBottom: '14px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDisputeModal(false)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDispute}
                disabled={loadingAction}
                style={{
                  background: 'var(--accent-rose)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsView;
