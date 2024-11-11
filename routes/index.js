// Import required modules
const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt'); // Import bcrypt to hash passwords
const db = require('../config/db'); // Import the MySQL database configuration
const router = express.Router();
dotenv.config();

// Main route to handle the home page logic
router.get('/', async (req, res) => {
  const isAuthenticated = req.oidc.isAuthenticated();
  const user = isAuthenticated ? req.oidc.user : null;
  console.log(user);

  if (isAuthenticated && user) {
    const { sub: auth0Id, name, email, role } = user; // Extract role from Auth0 user object
    const hashedPassword = await bcrypt.hash(auth0Id, 10); // Normally you'd get this from user input

    try {
      const [results] = await db.execute('SELECT * FROM users1 WHERE auth0_id = ?', [auth0Id]);
      let userRole = req.query.role === 'admin' ? 'admin' : 'user';
      //req.query.results.entries
      console.log(req.query.role);
      if (results.length === 0) {
        // New user, insert into database
        await db.execute(
          'INSERT INTO users1 (auth0_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
          [auth0Id, name, email, hashedPassword, userRole]
        );
        console.log('New user added:', name);
      } else {
        // Existing user, update details in the database
        userRole = results[0].role; 
        if (req.query.role === 'Admin' && results[0].role !== 'admin') { userRole = 'admin'; }// Set userRole to admin if 'Admin' was entered }
        console.log(userRole);// Existing role
        await db.execute(
          'UPDATE users1 SET name = ?, email = ?, password = ?, role=? WHERE auth0_id = ?',
          [name, email, hashedPassword, userRole,auth0Id]
        );
        console.log('User updated:', name);
      }

      // Redirect based on role
      if (role == 'admin') {
        return res.redirect('/admin');
      } else {
        return res.redirect('/user'); // Or whatever the default page is for regular users
      }
    } catch (error) {
      console.error('Error interacting with the database:', error);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    // If not authenticated, show a login link
    res.send(`
      <p>You are not logged in. <a href="/login">Login</a> to continue.</p>
    `);
  }
});

// Login route (this redirects the user to Auth0 for login)
router.get('/login', (req, res) => {
  res.oidc.login();
});

// Logout route (logs out user and redirects to home)
router.get('/logout', (req, res) => {
  res.oidc.logout({ returnTo: 'http://localhost:4000' });  // Redirect to home after logout
});

// Admin route (only accessible to users with the "admin" role)
router.get('/admin', async (req, res) => {
  // Ensure user is authenticated
  if (req.oidc.isAuthenticated()) {
    const userId = req.oidc.user.sub;  // Extract the Auth0 ID (sub) from the authenticated user

    try {
      // Query the database to get the user data based on Auth0 ID
      const [results] = await db.execute('SELECT * FROM users1 WHERE auth0_id = ?', [userId]);

      // Check if the user exists and their role is "admin"
      if (results.length > 0 && results[0].role == 'admin') {
        res.send('<h2>Welcome to the Admin Panel</h2><p><a href="/logout">Logout</a></p>');
      } else {
        // User exists but is not an admin, or does not exist
        res.status(403).send('Access denied');
      }
    } catch (error) {
      console.error('Error fetching user from the database:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    // User is not authenticated
    res.status(401).send('Unauthorized');
  }
});

// User route (default user page)
router.get('/user', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.send('<h2>Welcome User</h2><p><a href="/logout">Logout</a></p>');
  } else {
    res.status(403).send('Access denied');
  }
});

module.exports = router;  // Export the router for use in your app
