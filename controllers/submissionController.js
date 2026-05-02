const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { executeCode, generateVerdict } = require("../utils/piston");

function isExecutionServiceError(executionResult) {
  if (executionResult?.success !== false) return false;
  return executionResult.errorCode !== 'ECONNABORTED';
}

function sendExecutionServiceError(res, executionResult) {
  return res.status(503).json({
    error: 'Code execution service is unavailable',
    details: executionResult?.stderr || executionResult?.error || 'Unable to reach the code execution service.',
  });
}

/**
 * Run code without submitting
 * Used for testing code before final submission
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.runCode = async (req, res) => {
  try {
    // Extract code, language, and input from request body
    const { code, language, input = '', problemId } = req.body;

    // Validate required fields
    if (!code || !language) {
      return res.status(400).json({
        error: 'Code and language are required',
      });
    }

    // Execute the code using Piston API
    const executionResult = await executeCode(code, language, input);

    if (isExecutionServiceError(executionResult)) {
      return sendExecutionServiceError(res, executionResult);
    }

    // Return execution result to frontend
    res.json({
      success: executionResult.success,
      output: executionResult.output,
      stderr: executionResult.stderr,
      compileOutput: executionResult.compileOutput,
      error: executionResult.error,
      executionTime: executionResult.executionTime,
    });
  } catch (error) {
    // Log error and return error response
    console.error('Code execution error:', error.message);
    res.status(500).json({
      error: 'Failed to execute code',
      details: error.message,
    });
  }
};

/**
 * Submit code for evaluation
 * Compares output with all test cases and generates verdict
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.submitCode = async (req, res) => {
  try {
    // Extract code, language, and problem ID from request body
    const { code, language, problemId } = req.body;

    // Validate required fields
    if (!code || !language || !problemId) {
      return res.status(400).json({
        error: 'Code, language, and problemId are required',
      });
    }

    // Fetch the problem from database
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        error: 'Problem not found',
      });
    }

    const hasTestCases = Array.isArray(problem.testCases) && problem.testCases.length > 0;
    const hasSampleCase = Boolean((problem.sampleInput || '').trim() || (problem.sampleOutput || '').trim());

    let verdict = 'Accepted';
    let finalExecutionResult = null;
    let expectedOutput = !hasTestCases && hasSampleCase ? String(problem.sampleOutput ?? '') : '';
    let passedTestCases = 0;
    let totalTestCases = hasTestCases ? problem.testCases.length : hasSampleCase ? 1 : 0;
    let failedTestCaseIndex = null;

    if (!hasTestCases && !hasSampleCase) {
      // No grading data available: treat "Accepted" as "ran successfully without errors".
      finalExecutionResult = await executeCode(code, language, '');

      if (isExecutionServiceError(finalExecutionResult)) {
        return sendExecutionServiceError(res, finalExecutionResult);
      }

      if (finalExecutionResult.compileOutput && finalExecutionResult.compileOutput.trim()) {
        verdict = 'Compilation Error';
      } else if (!finalExecutionResult.success || (finalExecutionResult.stderr && finalExecutionResult.stderr.trim())) {
        verdict = 'Runtime Error';
      } else {
        verdict = 'Accepted';
      }
    } else {
      const evaluationCases = hasTestCases
        ? problem.testCases
        : [{ input: problem.sampleInput || '', expectedOutput: problem.sampleOutput || '' }];

      for (let i = 0; i < evaluationCases.length; i += 1) {
        const testCase = evaluationCases[i] || {};
        const caseExpectedOutput = String(testCase.expectedOutput ?? '');
        finalExecutionResult = await executeCode(code, language, String(testCase.input ?? ''));

        if (isExecutionServiceError(finalExecutionResult)) {
          return sendExecutionServiceError(res, finalExecutionResult);
        }

        verdict = generateVerdict(finalExecutionResult, caseExpectedOutput);

        if (verdict === 'Accepted') {
          passedTestCases += 1;
          continue;
        }

        failedTestCaseIndex = i + 1;
        break;
      }
    }

    const responseOutput =
      hasTestCases && (verdict === 'Accepted' || verdict === 'Wrong Answer') ? '' : finalExecutionResult?.output || '';

    // Save submission to database for tracking
    const submission = await Submission.create({
      problem: problemId,
      user: req.user._id,
      code,
      language,
      verdict,
      output: responseOutput,
      stderr: finalExecutionResult?.stderr || '',
      compileOutput: finalExecutionResult?.compileOutput || '',
    });

    // Return result with verdict
    res.json({
      success: true,
      verdict,
      output: responseOutput,
      expectedOutput,
      stderr: finalExecutionResult?.stderr || '',
      compileOutput: finalExecutionResult?.compileOutput || '',
      passedTestCases,
      totalTestCases,
      failedTestCaseIndex,
      submissionId: submission._id,
    });
  } catch (error) {
    // Log error and return error response
    console.error('Code submission error:', error.message);
    res.status(500).json({
      error: 'Failed to submit code',
      details: error.message,
    });
  }
};

/**
 * Get submission history for current user
 * Lists all code submissions made by the logged-in user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.history = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    // Fetch submissions for current user, sorted by newest first
    const submissions = await Submission.find({ user: req.user._id })
      .populate('problem', 'title') // Include problem title
      .sort('-submittedAt') // Sort by newest first
      .limit(50); // Limit to last 50 submissions

    // Return submissions
    res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    // Log error and return error response
    console.error('Error fetching submission history:', error.message);
    res.status(500).json({
      error: 'Failed to fetch submission history',
      details: error.message,
    });
  }
};
