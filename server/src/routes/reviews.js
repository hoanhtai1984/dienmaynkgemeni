const express = require('express');
const requireCustomer = require('../middleware/requireCustomer');
const { listForProduct, checkEligibility, submit } = require('../controllers/reviewsController');

const router = express.Router();

router.get('/product/:productId', listForProduct);
router.get('/eligibility/:productId', requireCustomer, checkEligibility);
router.post('/', requireCustomer, submit);

module.exports = router;
