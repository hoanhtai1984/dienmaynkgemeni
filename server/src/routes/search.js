const express = require('express');
const { suggest } = require('../controllers/searchController');

const router = express.Router();

router.get('/', suggest);

module.exports = router;
