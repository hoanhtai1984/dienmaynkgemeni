const express = require('express');
const { subscribe } = require('../controllers/newsletterController');
const { createPublicSubmissionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', createPublicSubmissionLimiter(), subscribe);

module.exports = router;
