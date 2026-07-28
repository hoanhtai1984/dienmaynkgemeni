const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const requireRole = require('../middleware/requireRole');
const { list, create, detail, setNeedsAttention, setBlocked, remove, activity } = require('../controllers/adminCustomersController');

const router = express.Router();

router.use(requireAdmin);
router.use(requireRole('OWNER', 'MANAGER', 'STAFF'));

router.get('/', list);
router.post('/', create);
router.get('/activity', activity);
router.get('/:id', detail);
router.patch('/:id/needs-attention', setNeedsAttention);
// Khóa/xoá tài khoản là hành động nhạy cảm hơn - chỉ OWNER/MANAGER, không
// cho STAFF (khác các thao tác còn lại ở trên, mở cho cả STAFF).
router.patch('/:id/block', requireRole('OWNER', 'MANAGER'), setBlocked);
router.delete('/:id', requireRole('OWNER', 'MANAGER'), remove);

module.exports = router;
