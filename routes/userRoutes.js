// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authentication');

router.get('/user', authMiddleware, (req, res) => {
  res.send('<h2>Welcome User</h2><p><a href="/logout">Logout</a></p>');
});

module.exports = router;
