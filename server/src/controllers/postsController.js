const prisma = require('../lib/prisma');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

function serializePost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    image: post.image,
    category: post.category,
    publishedAt: post.publishedAt,
  };
}

async function list(req, res) {
  const { limit, page, skip } = parsePagination(req.query);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      orderBy: { publishedAt: 'desc' },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.post.count(),
  ]);

  res.json(paginatedResponse(posts.map(serializePost), total, page, limit));
}

async function detail(req, res) {
  const post = await prisma.post.findUnique({ where: { slug: req.params.slug } });
  if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  res.json(serializePost(post));
}

module.exports = { list, detail, serializePost };
