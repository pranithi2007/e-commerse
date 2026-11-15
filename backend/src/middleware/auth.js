/**
 * Authentication & Authorization Middleware
 */

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to proceed.'
    });
  }
  
  // Store redirect URL and redirect to login page
  req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges are required.'
    });
  }
  
  return res.status(403).send('Forbidden: Admin access only.');
}

function optionalAuth(req, res, next) {
  // If session has user, attach to req.user
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  optionalAuth
};
