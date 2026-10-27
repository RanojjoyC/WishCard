const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAvailableRequests,
  getRequestById,
  acceptRequest,
  createEscrowPaymentOrder,
  confirmEscrowPayment,
  uploadPurchaseProof,
  confirmItemDeliveredToHolder,
  verifyHandoff,
  releaseEscrowPayout,
  cancelRequest,
  raiseDispute,
  submitRating,
  getMyOrders,
  getAllAdminOrders,
  resolveDisputeRefundBuyer,
  resolveDisputePayHolder
} = require('../controllers/requestController');
const { protect, adminOnly } = require('../middlewares/auth');

router.post('/', protect, createRequest);
router.get('/feed', protect, getAvailableRequests);
router.get('/my-orders', protect, getMyOrders);
router.get('/admin/all', protect, adminOnly, getAllAdminOrders);
router.get('/:id', protect, getRequestById);
router.post('/:id/accept', protect, acceptRequest);
router.post('/:id/escrow-order', protect, createEscrowPaymentOrder);
router.post('/:id/escrow-confirm', protect, confirmEscrowPayment);
router.post('/:id/purchase-proof', protect, uploadPurchaseProof);
router.post('/:id/confirm-delivered', protect, confirmItemDeliveredToHolder);
router.post('/:id/verify-handoff', protect, verifyHandoff);
router.post('/:id/release-payout', protect, adminOnly, releaseEscrowPayout);
router.post('/:id/resolve-refund', protect, adminOnly, resolveDisputeRefundBuyer);
router.post('/:id/resolve-payout', protect, adminOnly, resolveDisputePayHolder);
router.post('/:id/cancel', protect, cancelRequest);
router.post('/:id/dispute', protect, raiseDispute);
router.post('/:id/rate', protect, submitRating);

module.exports = router;

