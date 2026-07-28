async function uploadThemeImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Thiếu file ảnh' });
  res.status(201).json({ url: `/uploads/theme/${req.file.filename}` });
}

module.exports = { uploadThemeImage };
