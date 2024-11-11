// middleware/authentication.js
module.exports = (req, res, next) => {
    if (!req.oidc.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    next();
  };
  