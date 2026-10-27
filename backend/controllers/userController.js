const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id, email) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in environment');
  }
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET.trim(),
    { expiresIn: '30d' }
  );
};

// Seed or ensure Admin user exists on boot
exports.seedAdminUser = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@wishcard.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminSecure2026!Pass';

  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    await User.create({
      name: process.env.ADMIN_NAME || 'Platform Administrator',
      email: adminEmail,
      phone: '+91 99999 00001',
      password: hashedPassword,
      role: 'admin',
      collegeName: 'WishCard Escrow HQ',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      isGovIdVerified: true,
      govIdType: 'Platform Trustee & Escrow Administrator',
      trustScore: 100,
      totalOrdersCompleted: 0,
      rating: 5.0,
      ratingsCount: 0,
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
        address: 'WishCard Escrow Vault'
      },
      creditCards: [],
      upiId: process.env.ADMIN_UPI_ID || 'escrow@wishcard'
    });
    console.log(`[Admin Seed] Default admin seeded: ${adminEmail}`);
  }
};

// 1. User Registration
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, collegeName, studentIdRoll, address, bankName, cardType, last4Digits } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Prevent regular registration with reserved admin email
    if (cleanEmail === (process.env.ADMIN_EMAIL || 'admin@wishcard.com').toLowerCase().trim()) {
      return res.status(400).json({ success: false, message: 'This email is reserved for platform administration.' });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const initialCards = [];
    if (bankName && cardType && last4Digits) {
      if (!/^\d{4}$/.test(last4Digits)) {
        return res.status(400).json({ success: false, message: 'Card last 4 digits must be exactly 4 digits.' });
      }
      initialCards.push({
        bankName: bankName.trim(),
        cardType: cardType.trim(),
        network: req.body.network || 'Visa',
        last4Digits: last4Digits.trim(),
        cardHolderName: name.trim(),
        specialOffers: req.body.specialOffers ? (Array.isArray(req.body.specialOffers) ? req.body.specialOffers : [req.body.specialOffers]) : [],
        verified: false,
        maxLimitAvailable: Number(req.body.maxLimitAvailable) || 0
      });
    }

    const regCoordinates = (req.body.coordinates && Array.isArray(req.body.coordinates) && req.body.coordinates.length === 2)
      ? req.body.coordinates
      : [0, 0];

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      role: 'both',
      collegeName: collegeName ? collegeName.trim() : '',
      studentIdRoll: studentIdRoll ? studentIdRoll.trim() : '',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1a1816&textColor=ffffff`,
      isGovIdVerified: false,
      govIdType: 'Campus Student ID',
      trustScore: 0,
      totalOrdersCompleted: 0,
      rating: 0,
      ratingsCount: 0,
      location: {
        type: 'Point',
        coordinates: regCoordinates,
        address: address ? address.trim() : (collegeName ? collegeName.trim() : '')
      },
      creditCards: initialCards,
      upiId: `${cleanEmail.split('@')[0]}@okaxis`
    });

    const token = generateToken(newUser._id, newUser.email);

    res.status(201).json({
      success: true,
      token,
      user: newUser.toSafeObject(true)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const foundUser = await User.findOne({ email: cleanEmail });

    if (!foundUser) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, foundUser.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(foundUser._id, foundUser.email);
    res.json({
      success: true,
      token,
      user: foundUser.toSafeObject(true)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Current User Profile
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject(true) });
};

// 4. Add Credit Card
exports.addCreditCard = async (req, res) => {
  try {
    const { bankName, cardType, network, last4Digits, cardHolderName, cardProofUrl, specialOffers } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.creditCards.length >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 credit cards allowed per account.' });
    }

    if (!bankName || !cardType || !last4Digits) {
      return res.status(400).json({ success: false, message: 'Bank name, card type, and last 4 digits are required.' });
    }

    if (!/^\d{4}$/.test(last4Digits)) {
      return res.status(400).json({ success: false, message: 'Last 4 digits must be exactly 4 digits.' });
    }

    const cleanOffers = Array.isArray(specialOffers)
      ? specialOffers.filter(Boolean)
      : (specialOffers ? specialOffers.split(',').map(s => s.trim()).filter(Boolean) : []);

    const newCard = {
      bankName: bankName.trim(),
      cardType: cardType.trim(),
      network: network || 'Visa',
      last4Digits: last4Digits.trim(),
      cardHolderName: cardHolderName || user.name,
      cardProofUrl: cardProofUrl || '',
      specialOffers: cleanOffers,
      verified: false
    };

    user.creditCards.push(newCard);
    await user.save();

    res.json({
      success: true,
      message: 'Card added successfully.',
      creditCards: user.creditCards
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4b. Update Credit Card
exports.updateCreditCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { bankName, cardType, network, last4Digits, cardHolderName, specialOffers } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const card = user.creditCards.id(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found in your account.' });
    }

    let coreDetailsChanged = false;
    if (bankName && bankName.trim() !== card.bankName) {
      card.bankName = bankName.trim();
      coreDetailsChanged = true;
    }
    if (cardType && cardType.trim() !== card.cardType) {
      card.cardType = cardType.trim();
      coreDetailsChanged = true;
    }
    if (network) card.network = network;
    if (last4Digits) {
      if (!/^\d{4}$/.test(last4Digits)) {
        return res.status(400).json({ success: false, message: 'Last 4 digits must be exactly 4 digits.' });
      }
      if (last4Digits.trim() !== card.last4Digits) {
        card.last4Digits = last4Digits.trim();
        coreDetailsChanged = true;
      }
    }
    if (cardHolderName) card.cardHolderName = cardHolderName.trim();
    if (specialOffers !== undefined) {
      card.specialOffers = Array.isArray(specialOffers)
        ? specialOffers.filter(Boolean)
        : (specialOffers ? specialOffers.split(',').map(s => s.trim()).filter(Boolean) : []);
    }

    if (coreDetailsChanged) {
      card.verified = false;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Card updated successfully.',
      creditCards: user.creditCards
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4c. Delete Credit Card
exports.deleteCreditCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const card = user.creditCards.id(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found in your account.' });
    }

    user.creditCards.pull(cardId);
    await user.save();

    res.json({
      success: true,
      message: 'Card removed successfully.',
      creditCards: user.creditCards
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4d. Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, collegeName, upiId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (collegeName) user.collegeName = collegeName.trim();
    if (address !== undefined) {
      user.location.address = address.trim();
    }
    if (upiId !== undefined) {
      if (upiId && !upiId.includes('@')) {
        return res.status(400).json({ success: false, message: 'Invalid UPI ID format (e.g. name@okhdfcbank).' });
      }
      user.upiId = upiId.trim();
    }

    await user.save();
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toSafeObject(true)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update Location
exports.updateLocation = async (req, res) => {
  try {
    const { coordinates, address } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      const [lng, lat] = coordinates.map(Number);
      if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        user.location.coordinates = [lng, lat];
      }
    }
    if (address) user.location.address = address.trim();

    await user.save();
    res.json({ success: true, location: user.location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Update UPI
exports.updateUpi = async (req, res) => {
  try {
    const { upiId } = req.body;
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid UPI ID format (e.g. name@bank).' });
    }
    const user = await User.findById(req.user._id);
    user.upiId = upiId.trim();
    await user.save();
    res.json({ success: true, upiId: user.upiId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

