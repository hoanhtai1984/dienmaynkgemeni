const express = require('express');
const { create } = require('../controllers/ordersController');
const { createPublicSubmissionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', createPublicSubmissionLimiter(), create);

module.exports = router;
