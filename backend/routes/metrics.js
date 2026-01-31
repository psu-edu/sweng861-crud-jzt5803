const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Metric } = require('../database');
const eventEmitter = require('../services/eventEmitter');
const authenticateToken = require('../authMiddleware');

const router = express.Router();

/**
 * Validation middleware - returns errors if validation fails
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
 * Metric validation rules
 */
const metricValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 255 })
      .withMessage('Name must be at most 255 characters'),
    body('category')
      .isIn(['enrollment', 'facilities', 'academic', 'financial', 'other'])
      .withMessage('Invalid category'),
    body('value').isFloat().withMessage('Value must be a number'),
    body('unit')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Unit must be at most 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be at most 1000 characters'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
    body('recordedAt')
      .optional()
      .isISO8601()
      .withMessage('recordedAt must be a valid ISO 8601 date'),
  ],
  update: [
    param('id').isUUID().withMessage('Invalid metric ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 255 })
      .withMessage('Name must be at most 255 characters'),
    body('category')
      .optional()
      .isIn(['enrollment', 'facilities', 'academic', 'financial', 'other'])
      .withMessage('Invalid category'),
    body('value').optional().isFloat().withMessage('Value must be a number'),
    body('unit')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Unit must be at most 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be at most 1000 characters'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  getById: [param('id').isUUID().withMessage('Invalid metric ID')],
  list: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be non-negative'),
    query('category')
      .optional()
      .isIn(['enrollment', 'facilities', 'academic', 'financial', 'other'])
      .withMessage('Invalid category filter'),
  ],
};

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Get all metrics for the authenticated user
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of metrics to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of metrics to skip
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [enrollment, facilities, academic, financial, other]
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of metrics
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticateToken,
  metricValidation.list,
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const category = req.query.category;

      // Build query with ownership filter (prevents BOLA)
      const whereClause = { userId };
      if (category) {
        whereClause.category = category;
      }

      const { count, rows } = await Metric.findAndCountAll({
        where: whereClause,
        order: [['recordedAt', 'DESC']],
        limit,
        offset,
      });

      res.json({
        data: rows,
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: offset + rows.length < count,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/metrics/{id}:
 *   get:
 *     summary: Get a specific metric by ID
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Metric ID
 *     responses:
 *       200:
 *         description: Metric details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner
 *       404:
 *         description: Metric not found
 */
router.get(
  '/:id',
  authenticateToken,
  metricValidation.getById,
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const metricId = req.params.id;

      const metric = await Metric.findByPk(metricId);

      if (!metric) {
        return res.status(404).json({ error: 'Metric not found' });
      }

      // Ownership check (prevents BOLA/IDOR)
      if (metric.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this metric',
        });
      }

      res.json({ data: metric });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/metrics:
 *   post:
 *     summary: Create a new metric
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - value
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [enrollment, facilities, academic, financial, other]
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Metric created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticateToken,
  metricValidation.create,
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { name, category, value, unit, description, metadata, recordedAt } =
        req.body;

      // Create metric with user ownership
      const metric = await Metric.create({
        userId,
        name,
        category,
        value,
        unit: unit || 'count',
        description,
        metadata: metadata || {},
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      });

      // Emit domain event for async processing
      await eventEmitter.emitDomainEvent(
        'metric.created',
        'Metric',
        metric.id,
        { name, category, value, unit },
        userId
      );

      res.status(201).json({
        message: 'Metric created successfully',
        data: metric,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/metrics/{id}:
 *   put:
 *     summary: Update a metric
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Metric updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner
 *       404:
 *         description: Metric not found
 */
router.put(
  '/:id',
  authenticateToken,
  metricValidation.update,
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const metricId = req.params.id;

      const metric = await Metric.findByPk(metricId);

      if (!metric) {
        return res.status(404).json({ error: 'Metric not found' });
      }

      // Ownership check (prevents BOLA/IDOR)
      if (metric.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to modify this metric',
        });
      }

      const { name, category, value, unit, description, metadata } = req.body;

      // Track changes for event
      const changes = [];
      if (name !== undefined && name !== metric.name) changes.push('name');
      if (category !== undefined && category !== metric.category)
        changes.push('category');
      if (value !== undefined && value !== metric.value) changes.push('value');

      // Update metric
      await metric.update({
        name: name ?? metric.name,
        category: category ?? metric.category,
        value: value ?? metric.value,
        unit: unit ?? metric.unit,
        description: description ?? metric.description,
        metadata: metadata ?? metric.metadata,
      });

      // Emit domain event for async processing
      await eventEmitter.emitDomainEvent(
        'metric.updated',
        'Metric',
        metric.id,
        { id: metric.id, changes: changes.join(', ') || 'none' },
        userId
      );

      res.json({
        message: 'Metric updated successfully',
        data: metric,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/metrics/{id}:
 *   delete:
 *     summary: Delete a metric
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Metric deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner
 *       404:
 *         description: Metric not found
 */
router.delete(
  '/:id',
  authenticateToken,
  metricValidation.getById,
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const metricId = req.params.id;

      const metric = await Metric.findByPk(metricId);

      if (!metric) {
        return res.status(404).json({ error: 'Metric not found' });
      }

      // Ownership check (prevents BOLA/IDOR)
      if (metric.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to delete this metric',
        });
      }

      // Store metric data for event before deletion
      const metricData = metric.toJSON();

      await metric.destroy();

      // Emit domain event for async processing
      await eventEmitter.emitDomainEvent(
        'metric.deleted',
        'Metric',
        metricId,
        { id: metricId, name: metricData.name, category: metricData.category },
        userId
      );

      res.json({
        message: 'Metric deleted successfully',
        data: { id: metricId },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
