const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const { list, setApproved, setReply, remove } = require('../controllers/adminReviewsController');

const router = express.Router();

router.use(requireAdmin);

router.get('/', list);
router.patch('/:id', setApproved);
router.patch('/:id/reply', setReply);
router.delete('/:id', remove);

module.exports = router;
