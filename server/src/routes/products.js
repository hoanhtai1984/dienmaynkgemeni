const express = require('express');
const { list, detail, recommendations } = require('../controllers/productsController');

const router = express.Router();

router.get('/', list);
router.get('/:id', detail);
router.get('/:id/recommendations', recommendations);

module.exports = router;
