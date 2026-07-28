const prisma = require('../lib/prisma');

const VALID_SUBJECTS = ['TU_VAN', 'BAO_HANH', 'DON_HANG', 'KHAC'];
const SUBJECT_SLUG_TO_ENUM = {
  'tu-van': 'TU_VAN',
  'bao-hanh': 'BAO_HANH',
  'don-hang': 'DON_HANG',
  khac: 'KHAC',
};

async function create(req, res) {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Thiếu họ tên, số điện thoại hoặc nội dung' });
  }

  const subjectEnum = SUBJECT_SLUG_TO_ENUM[subject] || (VALID_SUBJECTS.includes(subject) ? subject : 'KHAC');

  const contact = await prisma.contactMessage.create({
    data: {
      name,
      email: email || null,
      phone,
      subject: subjectEnum,
      message,
      customerId: req.customer?.id,
    },
  });

  res.status(201).json(contact);
}

module.exports = { create };
