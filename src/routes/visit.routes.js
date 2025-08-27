const express = require('express');
const { body } = require('express-validator');
const visitController = require('../controllers/visit.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { hasPermission } = require('../middleware/rbac.middleware');
const { handleValidationErrors, validateObjectId, validatePagination } = require('../middleware/validation.middleware');
const { auditLogger } = require('../middleware/audit.middleware');
const router = express.Router();

/**
 * @route   POST /api/visits
 * @desc    Utworzenie nowej wizyty
 * @access  Private
 */
router.post(
  '/',
  [
    authenticateToken,
    hasPermission('visits:create'),
    auditLogger('CREATE_VISIT', 'Visit'),
    body('patient').isMongoId().withMessage('Valid patient ID is required'),
    body('employee').isMongoId().withMessage('Valid employee ID is required'),
    body('appointment').optional().isMongoId().withMessage('Valid appointment ID is required'),
    body('duration')
      .isNumeric()
      .custom(value => value > 0)
      .withMessage('Duration must be a positive number'),
    body('visitDate').optional().isISO8601().withMessage('Valid visit date is required'),
    body('vitalSigns.bloodPressure.systolic')
      .optional()
      .isNumeric()
      .custom(value => value >= 50 && value <= 300)
      .withMessage('Systolic blood pressure must be between 50 and 300'),
    body('vitalSigns.bloodPressure.diastolic')
      .optional()
      .isNumeric()
      .custom(value => value >= 30 && value <= 200)
      .withMessage('Diastolic blood pressure must be between 30 and 200'),
    body('vitalSigns.heartRate')
      .optional()
      .isNumeric()
      .custom(value => value >= 30 && value <= 250)
      .withMessage('Heart rate must be between 30 and 250'),
    handleValidationErrors
  ],
  visitController.createVisit
);

/**
 * @route   GET /api/visits/:id
 * @desc    Pobieranie pojedynczej wizyty
 * @access  Private
 */
router.get(
  '/:id',
  [
    authenticateToken,
    hasPermission('visits:read'),
    validateObjectId(),
    auditLogger('VIEW_VISIT', 'Visit')
  ],
  visitController.getVisitById
);

/**
 * @route   GET /api/visits/patient/:patientId
 * @desc    Pobieranie wizyt pacjenta
 * @access  Private
 */
router.get(
  '/patient/:patientId',
  [
    authenticateToken,
    hasPermission('visits:read'),
    validateObjectId('patientId'),
    validatePagination
  ],
  visitController.getPatientVisits
);

/**
 * @route   GET /api/visits/employee/:employeeId
 * @desc    Pobieranie wizyt pracownika
 * @access  Private
 */
router.get(
  '/employee/:employeeId',
  [
    authenticateToken,
    hasPermission('visits:read'),
    validateObjectId('employeeId'),
    validatePagination
  ],
  visitController.getEmployeeVisits
);

/**
 * @route   PUT /api/visits/:id
 * @desc    Aktualizacja wizyty
 * @access  Private
 */
router.put(
  '/:id',
  [
    authenticateToken,
    hasPermission('visits:update'),
    validateObjectId(),
    auditLogger('UPDATE_VISIT', 'Visit'),
    body('duration')
      .optional()
      .isNumeric()
      .custom(value => value > 0)
      .withMessage('Duration must be a positive number'),
    body('progressAssessment.painLevel')
      .optional()
      .isNumeric()
      .custom(value => value >= 0 && value <= 10)
      .withMessage('Pain level must be between 0 and 10'),
    body('progressAssessment.complianceLevel')
      .optional()
      .isIn(['excellent', 'good', 'fair', 'poor'])
      .withMessage('Compliance level must be one of: excellent, good, fair, poor'),
    handleValidationErrors
  ],
  visitController.updateVisit
);

/**
 * @route   PATCH /api/visits/:id/complete
 * @desc    Zakończenie wizyty
 * @access  Private
 */
router.patch(
  '/:id/complete',
  [
    authenticateToken,
    hasPermission('visits:update'),
    validateObjectId(),
    auditLogger('COMPLETE_VISIT', 'Visit'),
    body('progressAssessment.painLevel')
      .optional()
      .isNumeric()
      .custom(value => value >= 0 && value <= 10)
      .withMessage('Pain level must be between 0 and 10'),
    body('progressAssessment.complianceLevel')
      .optional()
      .isIn(['excellent', 'good', 'fair', 'poor'])
      .withMessage('Compliance level must be one of: excellent, good, fair, poor'),
    body('billing.totalCost')
      .optional()
      .isNumeric()
      .custom(value => value >= 0)
      .withMessage('Total cost must be a positive number'),
    handleValidationErrors
  ],
  visitController.completeVisit
);

/**
 * @route   PATCH /api/visits/:id/cancel
 * @desc    Anulowanie wizyty
 * @access  Private
 */
router.patch(
  '/:id/cancel',
  [
    authenticateToken,
    hasPermission('visits:cancel'),
    validateObjectId(),
    auditLogger('CANCEL_VISIT', 'Visit', 'high'),
    body('reason').optional().trim().notEmpty().withMessage('Cancellation reason cannot be empty'),
    handleValidationErrors
  ],
  visitController.cancelVisit
);

module.exports = router;
