const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/verify-token', auth, async (req, res) => {
  res.json({ ok: true, user: req.user ? req.user.toSafeObject() : null });
});

router.post('/refresh-token', auth, async (req, res) => {
  // If the current token is valid, return the current user info.
  // The frontend keeps the same cookie and can retry the original request.
  res.json({ success: true, user: req.user ? req.user.toSafeObject() : null });
});

router.get('/logout', auth, async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.json({ message: 'Logout successful' });
});

module.exports = router;
