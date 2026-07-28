const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const requireRole = require('../middleware/requireRole');
const { list, updateStatus } = require('../controllers/adminContactsController');

const router = express.Router();

router.use(requireAdmin);
router.use(requireRole('OWNER', 'MANAGER', 'STAFF'));

router.get('/', list);
router.patch('/:id', updateStatus);

module.exports = router;
