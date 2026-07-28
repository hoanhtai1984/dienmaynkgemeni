const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const requireRole = require('../middleware/requireRole');
const uploadPost = require('../middleware/uploadPost');
const { list, detail, create, update, remove } = require('../controllers/adminPostsController');

const router = express.Router();

router.use(requireAdmin);
router.use(requireRole('OWNER', 'MANAGER', 'STAFF'));

router.get('/', list);
router.get('/:id', detail);
router.post('/', uploadPost.single('image'), create);
router.put('/:id', uploadPost.single('image'), update);
router.delete('/:id', remove);

module.exports = router;
