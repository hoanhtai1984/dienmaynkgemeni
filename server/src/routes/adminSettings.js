const express = require('express');
const { update, updatePolicyPage } = require('../controllers/adminSettingsController');
const { uploadThemeImage } = require('../controllers/adminThemeUploadController');
const { get: getMailSettings, update: updateMailSettings } = require('../controllers/adminMailSettingsController');
const { upload, convertToWebp } = require('../middleware/uploadTheme');
const requireAdmin = require('../middleware/requireAdmin');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAdmin);
router.use(requireRole('OWNER', 'MANAGER'));

router.put('/', update);
router.patch('/policy-pages/:slug', updatePolicyPage);
router.post('/theme-upload', upload.single('image'), convertToWebp, uploadThemeImage);
router.get('/mail', getMailSettings);
router.put('/mail', updateMailSettings);

module.exports = router;
