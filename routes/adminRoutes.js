// routes/adminRoutes.js
const express = require('express');
const db = require('../config/db');
const router = express.Router();
const authMiddleware = require('../middleware/authentication');

router.get('/admin', authMiddleware, async (req, res) => {
  const userId = req.oidc.user.sub;

  try {
    const [results] = await db.execute('SELECT * FROM users1 WHERE auth0_id = ?', [userId]);

    if (results.length > 0 && results[0].role === 'admin') {
      res.send('<h2>Welcome to the Admin Panel</h2><p><a href="/logout">Logout</a></p>');
    } else {
      res.status(403).send('Access denied');
    }
  } catch (error) {
    console.error('Error fetching user from the database:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
