const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const requireRole = require('../middleware/requireRole');
const { list, create, remove, resetPassword, activity } = require('../controllers/adminMembersController');

const router = express.Router();

router.use(requireAdmin);
router.use(requireRole('OWNER'));

router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);
router.post('/:id/reset-password', resetPassword);
router.get('/activity', activity);

module.exports = router;
