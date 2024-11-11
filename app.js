// app.js
const express = require('express');
const dotenv = require('dotenv');
const { auth } = require('express-openid-connect');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bcrypt = require('bcrypt');

const db = require('./config/db');

dotenv.config();
const app = express();

// Auth0 configuration
app.use(auth({
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
}));

// Routes
app.use(authRoutes);
app.use(userRoutes);
app.use(adminRoutes);

// Home Route
app.get('/', async (req, res) => {
  console.log('Query Parameters:', req.query);

  const isAuthenticated = req.oidc.isAuthenticated();
  const user = isAuthenticated ? req.oidc.user : null;

  if (isAuthenticated && user) {
    const { sub: auth0Id, name, email,role } = user;

    // Validate user data
    /*if (!auth0Id || !name || !email) {
      console.error('User data is incomplete.');
      return res.status(400).send('User data is incomplete.');
    }*/

    const hashedPassword = await bcrypt.hash(auth0Id, 10);

    try {
      /*const [existingUser] = await db.execute('SELECT * FROM users1 WHERE email = ?', [email]);

      if (existingUser.length > 0) {
        console.log("User with this email already exists:", email);
        return res.status(400).send('User with this email already exists.');
      }*/

      const [results] = await db.execute('SELECT * FROM users1 WHERE auth0_id = ?', [auth0Id]);
      let userRole = req.query.role === 'admin' ? 'admin' : 'user';

      // Add default value for userRole
      userRole = userRole || 'user';

      if (results.length === 0) {
        await db.execute('INSERT INTO users1 (auth0_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [auth0Id, name, email, hashedPassword, userRole]);
      } else {
        userRole = results[0].role;
        if (req.query.role === 'Admin' && results[0].role !== 'admin') {
          userRole = 'admin';
        }
        await db.execute('UPDATE users1 SET name = ?, email = ?, password = ?, role = ? WHERE auth0_id = ?', [name, email, hashedPassword, userRole, auth0Id]);
      }

      // Redirect based on role
      return res.redirect(userRole === 'admin' ? '/admin' : '/user');
    } catch (error) {
      console.error('Error interacting with the database:', error);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    res.send('<p>You are not logged in. <a href="/login">Login</a> to continue.</p>');
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
