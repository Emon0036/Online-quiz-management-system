const axios = require('axios');

// Piston API endpoint for code execution
const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

// Mapping of language names to Piston language identifiers
const languageMap = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
  python: 'python',
};

/**
 * Execute code using Piston API
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language (c, cpp, java, javascript, python)
 * @param {string} input - Standard input for the program
 * @returns {Promise<object>} Execution result with output, stderr, and compile_output
 */
async function executeCode(code, language, input = '') {
  try {
    // Validate language
    if (!languageMap[language.toLowerCase()]) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Prepare payload for Piston API
    const payload = {
      language: languageMap[language.toLowerCase()],
      version: '*', // Use latest version
      files: [
        {
          name: `main.${getFileExtension(language)}`,
          content: code,
        },
      ],
      stdin: input || '', // Standard input (if any)
    };

    // Send request to Piston API
    const response = await axios.post(PISTON_API, payload, {
      timeout: 10000, // 10 second timeout
    });

    // Extract relevant data from response
    const { stdout, stderr, compile_output } = response.data.run || {};

    return {
      success: true,
      output: stdout || '',
      stderr: stderr || '',
      compileOutput: compile_output || '',
      language: language.toLowerCase(),
      executionTime: response.data.run?.wall_time || 'unknown',
    };
  } catch (error) {
    // Handle timeout or API errors
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Code execution timeout (> 10 seconds)',
        output: '',
        stderr: 'Execution timed out',
        compileOutput: '',
      };
    }

    // Handle other errors
    return {
      success: false,
      error: error.message || 'Code execution failed',
      output: '',
      stderr: error.response?.data?.message || error.message || '',
      compileOutput: '',
    };
  }
}

/**
 * Get file extension for a given language
 * @param {string} language - Programming language
 * @returns {string} File extension
 */
function getFileExtension(language) {
  const extensions = {
    c: 'c',
    cpp: 'cpp',
    java: 'java',
    javascript: 'js',
    python: 'py',
  };
  return extensions[language.toLowerCase()] || language;
}

/**
 * Compare code output with expected output
 * Handles whitespace normalization for fair comparison
 * @param {string} actualOutput - Output from code execution
 * @param {string} expectedOutput - Expected output
 * @returns {boolean} Whether outputs match
 */
function compareOutputs(actualOutput, expectedOutput) {
  // Normalize outputs: trim and split by lines
  const actual = (actualOutput || '')
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  const expected = (expectedOutput || '')
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  return actual === expected;
}

/**
 * Generate verdict based on execution result
 * @param {object} executionResult - Result from executeCode()
 * @param {string} expectedOutput - Expected output from test case
 * @returns {string} Verdict (Accepted, Wrong Answer, Runtime Error, Compilation Error)
 */
function generateVerdict(executionResult, expectedOutput) {
  // Check for compilation errors
  if (executionResult.compileOutput && executionResult.compileOutput.trim()) {
    return 'Compilation Error';
  }

  // Check for runtime errors
  if (!executionResult.success || (executionResult.stderr && executionResult.stderr.trim())) {
    return 'Runtime Error';
  }

  // Compare outputs
  if (compareOutputs(executionResult.output, expectedOutput)) {
    return 'Accepted';
  }

  return 'Wrong Answer';
}

module.exports = {
  executeCode,
  compareOutputs,
  generateVerdict,
  languageMap,
};
