const express = require('express');
const { get, recordVisit, like } = require('../controllers/siteStatsController');
const { createAccountActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', get);
router.post('/visit', createAccountActionLimiter(), recordVisit);
router.post('/like', createAccountActionLimiter(), like);

module.exports = router;
