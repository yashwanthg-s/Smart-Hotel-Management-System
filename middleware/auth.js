const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.session.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).redirect('/login');
  }
};

// Middleware to check role-based access
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check both req.user (from JWT) and req.session.user (from session)
    const user = req.user || req.session.user;
    
    if (!user) {
      return res.status(401).redirect('/login');
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).render('error', { 
        message: 'Access Denied: Insufficient permissions' 
      });
    }

    next();
  };
};

// Middleware to attach user data to request
const attachUser = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  verifyToken,
  checkRole,
  attachUser
};
