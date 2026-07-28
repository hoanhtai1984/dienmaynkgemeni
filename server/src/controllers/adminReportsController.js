const prisma = require('../lib/prisma');

async function latestSalesReport(req, res) {
  const report = await prisma.salesReport.findFirst({ orderBy: { reportDate: 'desc' } });
  if (!report) return res.json(null);

  const products = await prisma.product.findMany({
    where: { id: { in: report.topProductIds } },
    select: { id: true, name: true, brand: true, price: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const topProducts = report.topProductIds.map((id) => byId.get(id)).filter(Boolean);

  res.json({ ...report, topProducts });
}

// Danh sách báo cáo theo khoảng ngày (để xuất Excel theo tháng/quý/năm) - chỉ
// trả về số liệu tổng hợp mỗi ngày, không kèm chi tiết top sản phẩm (mỗi ngày
// một danh sách sản phẩm khác nhau, không có ý nghĩa gộp chung vào 1 dòng).
async function listSalesReports(req, res) {
  const { from, to } = req.query;
  const where = {};
  if (from || to) {
    where.reportDate = {};
    if (from) where.reportDate.gte = new Date(from);
    if (to) where.reportDate.lte = new Date(to);
  }

  const reports = await prisma.salesReport.findMany({
    where,
    orderBy: { reportDate: 'asc' },
    select: { reportDate: true, totalOrders: true, totalRevenue: true },
  });

  res.json(reports);
}

module.exports = { latestSalesReport, listSalesReports };
