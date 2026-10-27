const mongoose = require('mongoose');

const STATUS_ENUM = [
  'REQUESTED',
  'MATCHED',
  'ESCROW_FUNDED',
  'PURCHASED',
  'DELIVERED_TO_HOLDER',
  'HANDOFF_COMPLETED',
  'ESCROW_RELEASED',
  'CANCELLED',
  'DISPUTED'
];

const requestSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchedHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // Product Details
  productTitle: { type: String, required: [true, 'Product title is required'], trim: true },
  productUrl: { type: String, required: [true, 'Product URL is required'], trim: true },
  store: { type: String, required: [true, 'Store name is required'], trim: true },
  productScreenshot: { type: String, default: '' },
  category: { type: String, default: 'General', trim: true },
  
  // Card preference
  targetCardRequirement: { type: String, required: [true, 'Target card requirement is required'], trim: true },
  targetBank: { type: String, required: [true, 'Target bank is required'], trim: true },

  // Financial Breakdown
  originalPrice: { type: Number, required: [true, 'Original MRP is required'], min: [100, 'Original price must be at least ₹100'] },
  discountedPrice: { 
    type: Number, 
    required: [true, 'Discounted price is required'], 
    min: [50, 'Discounted price must be at least ₹50'],
    validate: {
      validator: function(val) {
        return val <= this.originalPrice;
      },
      message: 'Discounted price cannot exceed original MRP'
    }
  },
  holderFeePercent: { type: Number, default: 3 },
  holderProfit: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  totalEscrowAmount: { type: Number, required: true },

  // Status Progression
  status: {
    type: String,
    enum: STATUS_ENUM,
    default: 'REQUESTED'
  },

  // Cancellation and Dispute tracking
  cancellationReason: { type: String, default: '' },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  cancelledAt: { type: Date },
  disputeReason: { type: String, default: '' },
  disputeRaisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  disputeRaisedAt: { type: Date },

  // Delivery Address & verification instructions
  shippingAddress: {
    fullName: { type: String, default: '', trim: true },
    addressLine: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    postalCode: { type: String, default: '', trim: true },
    landmark: { type: String, default: '', trim: true }
  },

  // Escrow Payment Details
  paymentDetails: {
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    isPaidToEscrow: { type: Boolean, default: false },
    paidAt: { type: Date },
    payoutToHolderReleased: { type: Boolean, default: false },
    payoutUpiId: { type: String, default: '' },
    payoutReferenceId: { type: String, default: '' },
    payoutReleasedAt: { type: Date }
  },

  // Proofs uploaded by Holder
  purchaseProof: {
    orderId: { type: String, default: '' },
    invoiceUrl: { type: String, default: '' },
    screenshotUrl: { type: String, default: '' },
    uploadedAt: { type: Date }
  },

  receiptProof: {
    packagePhotoUrl: { type: String, default: '' },
    conditionNote: { type: String, default: '' },
    uploadedAt: { type: Date }
  },

  // Handoff Secret OTP (visible ONLY to buyer, verified server-side)
  handoffSecretOtp: { 
    type: String, 
    default: () => Math.floor(100000 + Math.random() * 900000).toString() 
  },
  safeMeetupLocation: { type: String, required: [true, 'Safe meetup location is required'], trim: true },
  
  // Buyer location snapshot for geospatial proximity
  buyerLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: { type: String, default: '' }
  },

  ratings: {
    buyerRating: { type: Number, min: 1, max: 5 },
    buyerReview: { type: String, default: '' },
    holderRating: { type: Number, min: 1, max: 5 },
    holderReview: { type: String, default: '' }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

requestSchema.index({ buyerLocation: '2dsphere' });
requestSchema.index({ status: 1 });
requestSchema.index({ buyer: 1 });
requestSchema.index({ matchedHolder: 1 });

// Helper to sanitize request based on calling user
requestSchema.methods.toSafeObject = function(currentUserId = null, isAdmin = false) {
  const obj = this.toObject();
  const buyerId = (obj.buyer?._id || obj.buyer || '').toString();
  const userIdStr = currentUserId ? currentUserId.toString() : '';

  // OTP is strictly visible to the buyer and platform admin only!
  if (!isAdmin && userIdStr !== buyerId) {
    delete obj.handoffSecretOtp;
  }
  return obj;
};

module.exports = mongoose.model('PurchaseRequest', requestSchema);
