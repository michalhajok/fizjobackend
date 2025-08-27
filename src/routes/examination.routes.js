const express = require('express');
const { body } = require('express-validator');
const examinationController = require('../controllers/examination.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { hasPermission } = require('../middleware/rbac.middleware');
const { handleValidationErrors, validateObjectId, validatePagination } = require('../middleware/validation.middleware');
const { auditLogger } = require('../middleware/audit.middleware');
const router = express.Router();

/**
 * @route   POST /api/examinations
 * @desc    Utworzenie nowego badania
 * @access  Private
 */
router.post(
  '/',
  [
    authenticateToken,
    hasPermission('examinations:create'),
    auditLogger('CREATE_EXAMINATION', 'Examination'),
    body('patient').isMongoId().withMessage('Valid patient ID is required'),
    body('examiner').optional().isMongoId().withMessage('Valid examiner ID is required'),
    body('subjectiveAssessment.chiefComplaint').optional().trim(),
    body('subjectiveAssessment.painScale')
      .optional()
      .isNumeric()
      .custom(value => value >= 0 && value <= 10)
      .withMessage('Pain scale must be between 0 and 10'),
    body('assessment.primaryDiagnosis').optional().trim(),
    handleValidationErrors
  ],
  examinationController.createExamination
);

/**
 * @route   GET /api/examinations/:id
 * @desc    Pobieranie pojedynczego badania
 * @access  Private
 */
router.get(
  '/:id',
  [
    authenticateToken,
    hasPermission('examinations:read'),
    validateObjectId(),
    auditLogger('VIEW_EXAMINATION', 'Examination')
  ],
  examinationController.getExaminationById
);

/**
 * @route   GET /api/examinations/patient/:patientId
 * @desc    Pobieranie badań pacjenta
 * @access  Private
 */
router.get(
  '/patient/:patientId',
  [
    authenticateToken,
    hasPermission('examinations:read'),
    validateObjectId('patientId'),
    validatePagination
  ],
  examinationController.getPatientExaminations
);

/**
 * @route   PUT /api/examinations/:id
 * @desc    Aktualizacja badania
 * @access  Private
 */
router.put(
  '/:id',
  [
    authenticateToken,
    hasPermission('examinations:update'),
    validateObjectId(),
    auditLogger('UPDATE_EXAMINATION', 'Examination'),
    body('subjectiveAssessment.painScale')
      .optional()
      .isNumeric()
      .custom(value => value >= 0 && value <= 10)
      .withMessage('Pain scale must be between 0 and 10'),
    handleValidationErrors
  ],
  examinationController.updateExamination
);

/**
 * @route   PATCH /api/examinations/:id/complete
 * @desc    Zakończenie badania
 * @access  Private
 */
router.patch(
  '/:id/complete',
  [
    authenticateToken,
    hasPermission('examinations:update'),
    validateObjectId(),
    auditLogger('COMPLETE_EXAMINATION', 'Examination')
  ],
  examinationController.completeExamination
);

/**
 * @route   PATCH /api/examinations/:id/review
 * @desc    Weryfikacja badania przez innego specjalistę
 * @access  Private
 */
router.patch(
  '/:id/review',
  [
    authenticateToken,
    hasPermission('examinations:review'),
    validateObjectId(),
    auditLogger('REVIEW_EXAMINATION', 'Examination')
  ],
  examinationController.reviewExamination
);

module.exports = router;
