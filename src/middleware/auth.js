const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Unauthorized - Missing or invalid token', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else if (err.name === 'TokenExpiredError') {
      next(new ApiError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else if (err.name === 'JsonWebTokenError') {
      next(new ApiError('Invalid token', 401, 'INVALID_TOKEN'));
    } else {
      next(new ApiError('Authentication failed', 401, 'AUTH_FAILED'));
    }
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('User not authenticated', 401, 'NOT_AUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
};

module.exports = { authenticate, authorize };
