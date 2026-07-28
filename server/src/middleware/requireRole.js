// Dùng sau requireAdmin (cần req.admin.role đã được gắn sẵn).
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập mục này' });
    }
    next();
  };
}

module.exports = requireRole;
