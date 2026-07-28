const express = require('express');
const { list, detail } = require('../controllers/postsController');

const router = express.Router();

router.get('/', list);
router.get('/:slug', detail);

module.exports = router;
