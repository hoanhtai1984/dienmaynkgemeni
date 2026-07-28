const express = require('express');
const optionalCustomer = require('../middleware/optionalCustomer');
const { create } = require('../controllers/contactController');
const { createPublicSubmissionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', createPublicSubmissionLimiter(), optionalCustomer, create);

module.exports = router;
