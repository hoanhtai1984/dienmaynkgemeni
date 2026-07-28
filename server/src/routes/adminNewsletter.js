const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const requireRole = require('../middleware/requireRole');
const { list } = require('../controllers/adminNewsletterController');

const router = express.Router();

router.use(requireAdmin);
router.use(requireRole('OWNER', 'MANAGER', 'STAFF'));

router.get('/', list);

module.exports = router;
