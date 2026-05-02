const express = require("express");
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { ensureAuthenticatedApi } = require('../middleware/authMiddleware');
const submissionController = require("../controllers/submissionController");

// Run code without submitting - test execution without evaluation
router.post("/run", ensureAuthenticatedApi, asyncHandler(submissionController.runCode));

// Submit code for evaluation against test cases
router.post("/submit", ensureAuthenticatedApi, asyncHandler(submissionController.submitCode));

// Get submission history for authenticated user
router.get("/history", ensureAuthenticatedApi, asyncHandler(submissionController.history));

module.exports = router;
