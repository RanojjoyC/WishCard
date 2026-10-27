const Message = require('../models/Message');
const PurchaseRequest = require('../models/PurchaseRequest');

exports.getMessages = async (req, res) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    const reqObj = await PurchaseRequest.findById(requestId)
      .populate('buyer', 'name email avatar collegeName')
      .populate('matchedHolder', 'name email avatar collegeName');

    if (!reqObj) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const buyerId = reqObj.buyer ? reqObj.buyer._id.toString() : '';
    const holderId = reqObj.matchedHolder ? reqObj.matchedHolder._id.toString() : '';

    const isParticipant = (currentUserId === buyerId || currentUserId === holderId) || isAdmin;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This chatroom is strictly private between the buyer and matched cardholder.'
      });
    }

    const list = await Message.find({ requestId }).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages: list,
      request: {
        _id: reqObj._id,
        productTitle: reqObj.productTitle,
        status: reqObj.status,
        buyer: reqObj.buyer,
        matchedHolder: reqObj.matchedHolder
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message, attachmentUrl } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    const reqObj = await PurchaseRequest.findById(requestId);
    if (!reqObj) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const buyerId = reqObj.buyer ? reqObj.buyer.toString() : '';
    const holderId = reqObj.matchedHolder ? reqObj.matchedHolder.toString() : '';

    const isParticipant = (currentUserId === buyerId || currentUserId === holderId) || isAdmin;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You cannot post in this private deal chatroom.'
      });
    }

    const isBuyer = currentUserId === buyerId;

    const newMsg = await Message.create({
      requestId,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: isBuyer ? 'Buyer' : (currentUserId === holderId ? 'Matched Cardholder' : 'Admin'),
      message: message.trim(),
      attachmentUrl: attachmentUrl || ''
    });

    res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
