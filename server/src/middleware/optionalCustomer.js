const jwt = require('jsonwebtoken');
const { getToken, CUSTOMER_COOKIE } = require('../utils/authCookies');

// Like requireCustomer, but never rejects the request - just sets req.customer
// when a valid customer token is present, otherwise leaves it undefined. For
// endpoints that work for both logged-in and anonymous visitors (contact form)
// but should attribute the submission to an account when one is logged in.
function optionalCustomer(req, res, next) {
  const token = getToken(req, CUSTOMER_COOKIE);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role === 'customer') req.customer = payload;
  } catch {
    // Invalid/expired token - treat as anonymous rather than failing the request.
  }
  next();
}

module.exports = optionalCustomer;
