const express = require("express");
const router = express.Router();
const icd9Controller = require("../controllers/icd9.controller");

// GET /api/icd9-procedures?search=...
router.get("/", icd9Controller.getIcd9Procedures);

module.exports = router;
