const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticate, managerOrAdmin } = require('../../middleware/auth.middleware');
const { success, error } = require('../../utils/apiResponse');
const logger = require('../../utils/logger');

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered inventory insights
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const proxyToAI = async (endpoint, data) => {
  const response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, data, { timeout: 30000 });
  return response.data;
};

router.use(authenticate);

/**
 * @swagger
 * /api/ai/restock-recommendations:
 *   get:
 *     summary: Get AI restock recommendations
 *     tags: [AI]
 */
router.get('/restock-recommendations', managerOrAdmin, async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const result = await proxyToAI('/recommendations/restock', { storeId });
    return success(res, result);
  } catch (err) {
    logger.error('AI service error:', err.message);
    return error(res, 'AI service unavailable. Please try again later.', 503);
  }
});

/**
 * @swagger
 * /api/ai/demand-prediction:
 *   post:
 *     summary: Predict demand for a product
 *     tags: [AI]
 */
router.post('/demand-prediction', managerOrAdmin, async (req, res, next) => {
  try {
    const result = await proxyToAI('/predictions/demand', req.body);
    return success(res, result);
  } catch (err) {
    logger.error('AI service error:', err.message);
    return error(res, 'AI service unavailable.', 503);
  }
});

/**
 * @swagger
 * /api/ai/insights:
 *   get:
 *     summary: Get AI inventory insights
 *     tags: [AI]
 */
router.get('/insights', async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const result = await proxyToAI('/insights', { storeId });
    return success(res, result);
  } catch (err) {
    logger.error('AI service error:', err.message);
    return error(res, 'AI service unavailable.', 503);
  }
});

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: Check AI service health
 *     tags: [AI]
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    return success(res, response.data);
  } catch {
    return error(res, 'AI service is offline.', 503);
  }
});

module.exports = router;
