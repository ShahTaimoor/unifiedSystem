const express = require('express');
const { auth } = require('../middleware/auth');

const authService = require('../services/authService');

const router = express.Router();

router.get('/verify-token', auth, async (req, res) => {
  try {
    const user = req.user ? req.user.toSafeObject() : null;
    if (user && user.role === 'customer') {
      await authService._attachCustomerData(user);
    }
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error verifying token' });
  }
});

router.post('/refresh-token', auth, async (req, res) => {
  // If the current token is valid, return the current user info.
  // The frontend keeps the same cookie and can retry the original request.
  const user = req.user ? req.user.toSafeObject() : null;
  if (user && user.role === 'customer') {
    await authService._attachCustomerData(user);
  }
  res.json({ success: true, user });
});

router.get('/logout', auth, async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  };

  // Clear all possible cookies
  res.clearCookie('token', cookieOptions);
  res.clearCookie('pos_token', cookieOptions);
  res.clearCookie('store_token', cookieOptions);
  res.clearCookie('pos_refresh_token', cookieOptions);
  res.clearCookie('store_refresh_token', cookieOptions);

  res.json({ message: 'Logout successful' });
});

module.exports = router;
