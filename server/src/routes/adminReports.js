const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const requireRole = require('../middleware/requireRole');
const { latestSalesReport, listSalesReports } = require('../controllers/adminReportsController');

const router = express.Router();

router.use(requireAdmin);
router.use(requireRole('OWNER', 'MANAGER', 'STAFF'));

router.get('/sales/latest', latestSalesReport);
router.get('/sales', listSalesReports);

module.exports = router;
