const express = require('express');
const {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
  deleteAccount,
} = require('../controllers/customerAuthController');
const requireCustomer = require('../middleware/requireCustomer');
const { createLoginLimiter, createAccountActionLimiter } = require('../middleware/rateLimiter');
const { list: listMyOrders, cancel: cancelMyOrder } = require('../controllers/customerOrdersController');

const router = express.Router();

router.post('/register', createAccountActionLimiter(), register);
router.post('/login', createLoginLimiter(), login);
router.get('/me', requireCustomer, me);
router.patch('/me', requireCustomer, updateProfile);
router.delete('/me', requireCustomer, deleteAccount);
router.post('/logout', requireCustomer, logout);
router.post('/forgot-password', createAccountActionLimiter(), forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/orders', requireCustomer, listMyOrders);
router.patch('/orders/:id/cancel', requireCustomer, cancelMyOrder);

module.exports = router;
