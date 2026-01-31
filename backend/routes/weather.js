const express = require('express');
const { query, validationResult } = require('express-validator');
const weatherService = require('../services/weatherService');
const authenticateToken = require('../authMiddleware');

const router = express.Router();

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Weather validation rules
 */
const weatherValidation = {
  fetch: [
    query('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    query('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
  ],
  history: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be non-negative'),
  ],
};

/**
 * @swagger
 * /api/weather:
 *   get:
 *     summary: Fetch current weather data for a location
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Location latitude (-90 to 90)
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Location longitude (-180 to 180)
 *     responses:
 *       200:
 *         description: Weather data retrieved successfully
 *       400:
 *         description: Invalid coordinates
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Weather API error
 */
router.get(
  '/',
  authenticateToken,
  weatherValidation.fetch,
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const latitude = parseFloat(req.query.latitude);
      const longitude = parseFloat(req.query.longitude);

      // Fetch and save weather data
      const weatherData = await weatherService.fetchAndSaveWeatherData(
        userId,
        latitude,
        longitude
      );

      res.json({
        message: 'Weather data retrieved and saved successfully',
        data: {
          id: weatherData.id,
          latitude: weatherData.latitude,
          longitude: weatherData.longitude,
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          weatherCode: weatherData.weatherCode,
          description: weatherData.description,
          fetchedAt: weatherData.fetchedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/weather/preview:
 *   get:
 *     summary: Preview weather data without saving (quick lookup)
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Weather data preview
 *       400:
 *         description: Invalid coordinates
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/preview',
  authenticateToken,
  weatherValidation.fetch,
  validate,
  async (req, res, next) => {
    try {
      const latitude = parseFloat(req.query.latitude);
      const longitude = parseFloat(req.query.longitude);

      // Fetch weather data without saving
      const weatherData = await weatherService.fetchWeatherData(
        latitude,
        longitude
      );

      res.json({
        message: 'Weather data preview',
        data: {
          latitude: weatherData.latitude,
          longitude: weatherData.longitude,
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          weatherCode: weatherData.weatherCode,
          description: weatherData.description,
          timezone: weatherData.timezone,
          fromCache: weatherData.fromCache,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/weather/history:
 *   get:
 *     summary: Get user's weather data history
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Weather history
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/history',
  authenticateToken,
  weatherValidation.history,
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const history = await weatherService.getUserWeatherHistory(userId, {
        limit,
        offset,
      });

      res.json(history);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/weather/cache/stats:
 *   get:
 *     summary: Get weather cache statistics
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/cache/stats', authenticateToken, (req, res) => {
  const stats = weatherService.getCacheStats();
  res.json({
    message: 'Cache statistics',
    data: stats,
  });
});

module.exports = router;
