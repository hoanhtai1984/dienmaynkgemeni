const express = require('express');
const { list } = require('../controllers/addressController');

const router = express.Router();

router.get('/', list);

module.exports = router;
