const cleanEnvVal = (val) => {
  if (!val) return '';
  return val.replace(/^['"]|['"]$/g, '').trim();
};

const getRazorpayInstance = () => {
  const Razorpay = require('razorpay');
  const key_id = cleanEnvVal(process.env.RAZORPAY_KEY_ID);
  const key_secret = cleanEnvVal(process.env.RAZORPAY_KEY_SECRET);

  if (!key_id || !key_secret) {
    console.warn('[Razorpay Config] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in environment.');
  }

  return new Razorpay({
    key_id: key_id || 'rzp_test_placeholder_key',
    key_secret: key_secret || 'rzp_test_placeholder_secret'
  });
};

const calculateDistanceKm = (coord1, coord2) => {
  if (!coord1 || !coord2 || !Array.isArray(coord1) || !Array.isArray(coord2)) return 0.4;
  const [lon1, lat1] = coord1.map(Number);
  const [lon2, lat2] = coord2.map(Number);

  if (isNaN(lon1) || isNaN(lat1) || isNaN(lon2) || isNaN(lat2)) return 0.4;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

// Centralized Fee Calculation to prevent client drift
const calculateFeeStructure = (discountedPrice) => {
  const price = Math.max(0, Number(discountedPrice) || 0);
  const holderProfit = Math.round(price * 0.03); // 3% commission to cardholder
  // Tiered or flat platform escrow fee: 1.5% capped at ₹50 minimum ₹15
  const platformFee = Math.max(15, Math.min(100, Math.round(price * 0.015)));
  const totalEscrowAmount = price + holderProfit + platformFee;

  return {
    discountedPrice: price,
    holderProfit,
    platformFee,
    totalEscrowAmount
  };
};

module.exports = {
  getRazorpayInstance,
  calculateDistanceKm,
  calculateFeeStructure,
  cleanEnvVal
};
