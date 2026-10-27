const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  bankName: { type: String, required: [true, 'Bank name is required'], trim: true },
  cardType: { type: String, required: [true, 'Card type/variant is required'], trim: true },
  network: { type: String, enum: ['Visa', 'Mastercard', 'RuPay', 'Amex', 'Mastercard / Visa'], default: 'Visa' },
  last4Digits: { 
    type: String, 
    required: [true, 'Last 4 digits are required'],
    match: [/^\d{4}$/, 'Last 4 digits must be exactly 4 numeric digits'] 
  },
  cardHolderName: { type: String, required: [true, 'Card holder name is required'], trim: true },
  cardProofUrl: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  specialOffers: [{ type: String, trim: true }],
  maxLimitAvailable: { type: Number, default: 0, min: 0 },
  addedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address format']
  },
  phone: { type: String, default: '', trim: true },
  password: { type: String, required: [true, 'Password is required'] },
  role: { type: String, enum: ['buyer', 'holder', 'both', 'admin'], default: 'both' },
  collegeName: { type: String, default: '', trim: true },
  studentIdRoll: { type: String, default: '', trim: true },
  avatar: { type: String, default: '' },
  
  // Verification & Trust
  isGovIdVerified: { type: Boolean, default: false },
  govIdType: { type: String, default: 'Campus Student ID' },
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  totalOrdersCompleted: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingsCount: { type: Number, default: 0, min: 0 },

  // Location details for GPS Proximity
  location: {
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

  // Max 5 credit cards listed
  creditCards: {
    type: [cardSchema],
    validate: [v => v.length <= 5, 'Cannot list more than 5 credit cards']
  },

  upiId: { type: String, default: '', trim: true }, // UPI destination for payouts

  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ location: '2dsphere' });

// Strip sensitive data before sending user objects to clients
userSchema.methods.toSafeObject = function(isOwnerOrAdmin = false) {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  if (!isOwnerOrAdmin) {
    delete obj.upiId;
    delete obj.phone;
    delete obj.studentIdRoll;
  }
  return obj;
};

module.exports = mongoose.model('User', userSchema);
