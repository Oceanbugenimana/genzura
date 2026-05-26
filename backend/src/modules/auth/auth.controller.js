const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const { success, created, unauthorized, badRequest } = require('../../utils/apiResponse');
const { createAuditLog } = require('../../middleware/audit.middleware');

// ── Token helpers ────────────────────────────────────────────
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

// ── Register ─────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               whatsappNumber: { type: string }
 *               preferredLang: { type: string, enum: [en, rw, sw, fr] }
 *     responses:
 *       201: { description: User registered successfully }
 *       409: { description: Email already exists }
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, whatsappNumber, preferredLang } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return badRequest(res, 'Email already registered.');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { fullName, email, password: hashedPassword, whatsappNumber, preferredLang },
      select: { id: true, fullName: true, email: true, role: true, preferredLang: true, createdAt: true },
    });

    await createAuditLog({
      userId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
      newValues: { email, fullName },
      req,
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    return created(res, { user, accessToken, refreshToken }, 'Registration successful.');
  } catch (err) {
    next(err);
  }
};

// ── Login ────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user || !user.isActive) return unauthorized(res, 'Invalid credentials.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return unauthorized(res, 'Invalid credentials.');

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      req,
    });

    return success(res, {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        preferredLang: user.preferredLang,
        whatsappNumber: user.whatsappNumber,
      },
      accessToken,
      refreshToken,
    }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security: []
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return unauthorized(res, 'Invalid or expired refresh token.');
    }

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, refreshToken: token, isActive: true, deletedAt: null },
    });

    if (!user) return unauthorized(res, 'Invalid refresh token.');

    const tokens = generateTokens(user.id, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    return success(res, tokens, 'Token refreshed.');
  } catch (err) {
    next(err);
  }
};

// ── Logout ───────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 */
const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });
    return success(res, null, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

// ── Get Me ───────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, fullName: true, email: true, role: true,
        whatsappNumber: true, preferredLang: true, createdAt: true,
      },
    });
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

// ── Change Password ──────────────────────────────────────────
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change current user password
 *     tags: [Auth]
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return badRequest(res, 'Current password is incorrect.');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed, refreshToken: null } });

    await createAuditLog({
      userId: req.user.id,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: req.user.id,
      req,
    });

    return success(res, null, 'Password changed successfully. Please log in again.');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, changePassword };
