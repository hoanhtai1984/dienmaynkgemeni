const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const { list, create, update, remove } = require('../controllers/adminCouponsController');

const router = express.Router();

router.use(requireAdmin);

router.get('/', list);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
