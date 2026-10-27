const User = require('../models/User');
const { calculateDistanceKm } = require('../utils/helpers');

exports.findCardHolders = async (req, res) => {
  try {
    const { bank, maxDistanceKm } = req.query;
    const currentUser = req.user;

    const query = {
      'creditCards.0': { $exists: true },
      _id: { $ne: currentUser._id },
      role: { $ne: 'admin' }
    };

    if (bank && bank !== 'ALL') {
      const cleanBank = bank.toUpperCase();
      query.$or = [
        { 'creditCards.bankName': new RegExp(bank, 'i') },
        { 'creditCards.cardType': new RegExp(bank, 'i') }
      ];
    }

    const holders = await User.find(query).select('-password');
    const userCoords = currentUser?.location?.coordinates;
    const hasValidUserCoords = Array.isArray(userCoords) && userCoords.length === 2 && (userCoords[0] !== 0 || userCoords[1] !== 0);

    const holdersWithDistance = holders.map(holder => {
      // Do not reveal sensitive details to other peers
      const safe = holder.toSafeObject(false);
      const holderCoords = holder.location?.coordinates;
      const hasValidHolderCoords = Array.isArray(holderCoords) && holderCoords.length === 2 && (holderCoords[0] !== 0 || holderCoords[1] !== 0);

      if (hasValidUserCoords && hasValidHolderCoords) {
        safe.distanceKm = calculateDistanceKm(userCoords, holderCoords);
      } else {
        safe.distanceKm = null;
      }
      return safe;
    });

    let results = holdersWithDistance;
    if (maxDistanceKm) {
      const maxD = parseFloat(maxDistanceKm);
      if (!isNaN(maxD)) {
        results = results.filter(h => h.distanceKm <= maxD);
      }
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, count: results.length, holders: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
