const express = require("express");
const { body } = require("express-validator");
const icfController = require("../controllers/icf.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

// const { protect, authorize } = require("../middleware/auth");

// const validate = [
//   body("coreSet")
//     .optional()
//     .isIn([
//       "lowBackPain",
//       "stroke",
//       "rheumatoidArthritis",
//       "shoulderPain",
//       "custom",
//     ]),
//   body("bodyFunctions").optional().isObject(),
//   body("bodyStructures").optional().isObject(),
//   body("activitiesParticipation").optional().isObject(),
//   body("environmentalFactors").optional().isObject(),
//   body("assessmentDate").optional().isISO8601(),
//   body("additionalNotes").optional().isString(),
//   body("status")
//     .optional()
//     .isIn(["draft", "completed", "reviewed", "archived"]),
// ];

const router = express.Router();

router.get(
  "/appointments/:appointmentId",
  authenticateToken,
  //protect,
  //authorize("physiotherapist", "admin"),
  icfController.getICFAssessment
);
router.post(
  "/appointments/:appointmentId/icf",
  authenticateToken,
  //protect,
  //   authorize("physiotherapist", "admin"),
  //   validate,
  icfController.createOrUpdateICFAssessment
);
router.delete(
  "/appointments/:appointmentId/icf",
  authenticateToken,
  //   protect,
  //   authorize("physiotherapist", "admin"),
  icfController.deleteICFAssessment
);
router.get(
  "/appointments/:appointmentId/icf/report",
  authenticateToken,
  //   protect,
  //   authorize("physiotherapist", "admin"),
  icfController.generateICFReport
);
router.get(
  "/patients/:patientId/icf-history",
  authenticateToken,
  //   protect,
  //   authorize("physiotherapist", "admin"),
  icfController.getPatientICFHistory
);

module.exports = router;
