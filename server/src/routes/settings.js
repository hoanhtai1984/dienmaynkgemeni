const express = require('express');
const { get } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', get);

module.exports = router;
