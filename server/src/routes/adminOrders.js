const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const { list, updateStatus, updatePaymentStatus, downloadInvoice } = require('../controllers/adminOrdersController');

const router = express.Router();

router.use(requireAdmin);

router.get('/', list);
router.get('/:id/invoice', downloadInvoice);
router.patch('/:id', updateStatus);
router.patch('/:id/payment-status', updatePaymentStatus);

module.exports = router;
