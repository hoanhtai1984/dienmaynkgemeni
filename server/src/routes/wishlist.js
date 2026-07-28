const express = require('express');
const requireCustomer = require('../middleware/requireCustomer');
const { list, listIds, toggle } = require('../controllers/wishlistController');

const router = express.Router();

router.get('/', requireCustomer, list);
router.get('/ids', requireCustomer, listIds);
router.post('/toggle', requireCustomer, toggle);

module.exports = router;
