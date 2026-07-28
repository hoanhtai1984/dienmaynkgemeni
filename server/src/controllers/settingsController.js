const prisma = require('../lib/prisma');

async function get(req, res) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) return res.status(404).json({ error: 'Chưa cấu hình site' });
  res.json(settings);
}

module.exports = { get };
