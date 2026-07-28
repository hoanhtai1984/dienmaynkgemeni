const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { serializePost } = require('./postsController');

function slugify(text) {
  return text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function deleteUploadedFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const filePath = path.join(__dirname, '../../', url);
  fs.unlink(filePath, () => {});
}

async function list(req, res) {
  const posts = await prisma.post.findMany({ orderBy: { publishedAt: 'desc' } });
  res.json(posts.map(serializePost));
}

async function detail(req, res) {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  res.json(serializePost(post));
}

async function create(req, res) {
  const { title, excerpt, content, category, publishedAt } = req.body;
  const slug = req.body.slug ? slugify(req.body.slug) : slugify(title);

  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) return res.status(400).json({ error: 'Đường dẫn (slug) đã tồn tại, vui lòng đổi tiêu đề hoặc slug khác' });

  const post = await prisma.post.create({
    data: {
      slug,
      title,
      excerpt,
      content,
      category,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      image: req.file ? `/uploads/posts/${req.file.filename}` : null,
    },
  });

  res.status(201).json(serializePost(post));
}

async function update(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy bài viết' });

  const { title, excerpt, content, category, publishedAt } = req.body;
  const slug = req.body.slug ? slugify(req.body.slug) : existing.slug;

  if (slug !== existing.slug) {
    const slugTaken = await prisma.post.findUnique({ where: { slug } });
    if (slugTaken) return res.status(400).json({ error: 'Đường dẫn (slug) đã tồn tại, vui lòng đổi tiêu đề hoặc slug khác' });
  }

  let image = existing.image;
  if (req.file) {
    deleteUploadedFile(existing.image);
    image = `/uploads/posts/${req.file.filename}`;
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      slug,
      title,
      excerpt,
      content,
      category,
      publishedAt: publishedAt ? new Date(publishedAt) : existing.publishedAt,
      image,
    },
  });

  res.json(serializePost(post));
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy bài viết' });

  await prisma.post.delete({ where: { id } });
  deleteUploadedFile(existing.image);

  res.status(204).send();
}

module.exports = { list, detail, create, update, remove };
