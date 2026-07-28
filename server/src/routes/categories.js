const express = require('express');
const { list, brands } = require('../controllers/categoriesController');

const router = express.Router();

router.get('/', list);
router.get('/:slug/brands', brands);

module.exports = router;
