const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const { upload, convertToWebp } = require('../middleware/upload');
const {
  list,
  detail,
  create,
  bulkCreate,
  update,
  remove,
  removeImage,
} = require('../controllers/adminProductsController');

const router = express.Router();

router.use(requireAdmin);

router.get('/', list);
router.post('/bulk', bulkCreate);
router.get('/:id', detail);
router.post('/', upload.array('images', 8), convertToWebp, create);
router.put('/:id', upload.array('images', 8), convertToWebp, update);
router.delete('/:id', remove);
router.delete('/:id/images/:imageId', removeImage);

module.exports = router;
