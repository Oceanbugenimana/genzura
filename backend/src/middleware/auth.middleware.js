const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { unauthorized, forbidden } = require('../utils/apiResponse');

// Verify JWT access token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Access token required.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, isActive: true, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        whatsappNumber: true,
        preferredLang: true,
      },
    });

    if (!user) return unauthorized(res, 'User not found or inactive.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'You do not have permission to perform this action.');
    }
    next();
  };
};

// Admin only shorthand
const adminOnly = authorize('ADMIN');
const managerOrAdmin = authorize('ADMIN', 'STOCK_MANAGER');

module.exports = { authenticate, authorize, adminOnly, managerOrAdmin };
