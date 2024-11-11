// routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Login route (redirects user to Auth0 for login)
router.get('/login', (req, res) => {
  res.oidc.login();
});

// Logout route (logs out user and redirects to home)
router.get('/logout', (req, res) => {
  res.oidc.logout({ returnTo: 'http://localhost:4000' });
});

module.exports = router;
