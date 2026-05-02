/**
 * Run code without submitting it for evaluation
 * Used for testing code before official submission
 * @param {string} problemId - ID of the problem
 */
async function runCode(problemId) {
  // Get code, language, and input from form elements
  const code = document.getElementById('code').value.trim();
  const language = document.getElementById('language').value;
  const input = document.getElementById('input').value;

  // Validate that code is not empty
  if (!code) {
    showStatus('Please write some code first.', 'warning');
    return;
  }

  // Show loading status
  showStatus('Running code...', 'info');

  // Clear previous results
  clearResults();

  try {
    // Send code execution request to server
    const response = await fetch('/submissions/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language,
        input,
        problemId,
      }),
    });

    const result = await response.json();

    // Check if execution was successful
    if (!response.ok) {
      const details = result.details ? `: ${result.details}` : '';
      showStatus(`Error: ${result.error}${details}`, 'danger');
      return;
    }

    // Show output section
    if (result.output) {
      document.getElementById('outputSection').style.display = 'block';
      document.getElementById('output').textContent = result.output;
    }

    // Show compilation errors if any
    if (result.compileOutput) {
      document.getElementById('stderrSection').style.display = 'block';
      document.getElementById('stderrMessage').textContent = result.compileOutput;
    }

    // Show runtime errors if any
    if (result.stderr) {
      document.getElementById('stderrSection').style.display = 'block';
      document.getElementById('stderrMessage').textContent = result.stderr;
    }

    // Show success status
    if (result.success) {
      showStatus('Code executed successfully!', 'success');
    } else if (result.error) {
      showStatus(`Error: ${result.error}`, 'danger');
    }
  } catch (error) {
    // Handle network errors
    showStatus(`Error: ${error.message}`, 'danger');
    console.error('Code execution error:', error);
  }
}

/**
 * Submit code for evaluation against test cases
 * @param {string} problemId - ID of the problem
 */
async function submitCode(problemId) {
  // Get code and language from form elements
  const code = document.getElementById('code').value.trim();
  const language = document.getElementById('language').value;

  // Validate that code is not empty
  if (!code) {
    showStatus('Please write some code first.', 'warning');
    return;
  }

  // Show loading status
  showStatus('Submitting code...', 'info');

  // Clear previous results
  clearResults();

  try {
    // Send code submission request to server
    const response = await fetch('/submissions/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language,
        problemId,
      }),
    });

    const result = await response.json();

    // Check if submission was successful
    if (!response.ok) {
      const details = result.details ? `: ${result.details}` : '';
      showStatus(`Error: ${result.error}${details}`, 'danger');
      return;
    }

    // Show verdict with appropriate styling
    showVerdict(result.verdict, {
      passedTestCases: result.passedTestCases,
      totalTestCases: result.totalTestCases,
      failedTestCaseIndex: result.failedTestCaseIndex,
    });

    // Show output section
    if (result.output) {
      document.getElementById('outputSection').style.display = 'block';
      document.getElementById('output').textContent = result.output;
    }

    // Show expected output for comparison
    if (result.expectedOutput) {
      document.getElementById('expectedSection').style.display = 'block';
      document.getElementById('expectedOutput').textContent = result.expectedOutput;
    }

    // Show compilation errors if any
    if (result.compileOutput) {
      document.getElementById('stderrSection').style.display = 'block';
      document.getElementById('stderrMessage').textContent = result.compileOutput;
    }

    // Show runtime errors if any
    if (result.stderr) {
      document.getElementById('stderrSection').style.display = 'block';
      document.getElementById('stderrMessage').textContent = result.stderr;
    }

    // Clear status after submission display
    document.getElementById('status').innerHTML = '';
  } catch (error) {
    // Handle network errors
    showStatus(`Error: ${error.message}`, 'danger');
    console.error('Code submission error:', error);
  }
}

/**
 * Display status message with appropriate Bootstrap alert styling
 * @param {string} message - Status message to display
 * @param {string} type - Alert type (success, danger, warning, info)
 */
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  const alertClass = `alert-${type}`;
  statusDiv.innerHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

/**
 * Display verdict badge with appropriate styling
 * @param {string} verdict - Verdict message (Accepted, Wrong Answer, Runtime Error, Compilation Error)
 */
function showVerdict(verdict, meta = {}) {
  const verdictDiv = document.getElementById('verdict');
  let badgeClass = 'text-bg-secondary'; // Default for unknown
  let icon = 'fa-circle-question';

  // Set badge color and icon based on verdict
  if (verdict === 'Accepted') {
    badgeClass = 'text-bg-success';
    icon = 'fa-check-circle';
  } else if (verdict === 'Wrong Answer') {
    badgeClass = 'text-bg-danger';
    icon = 'fa-times-circle';
  } else if (verdict === 'Runtime Error') {
    badgeClass = 'text-bg-warning';
    icon = 'fa-exclamation-circle';
  } else if (verdict === 'Compilation Error') {
    badgeClass = 'text-bg-danger';
    icon = 'fa-times-circle';
  }

  const passed = Number(meta.passedTestCases || 0);
  const total = Number(meta.totalTestCases || 0);
  const failedIndex = meta.failedTestCaseIndex ? Number(meta.failedTestCaseIndex) : null;

  const progressHtml =
    total > 0
      ? `<div class="small text-muted mt-2">Passed ${passed}/${total} test case${total === 1 ? '' : 's'}${failedIndex ? ` (failed on #${failedIndex})` : ''}.</div>`
      : '';

  verdictDiv.innerHTML = `
    <div class="badge ${badgeClass} p-2 fs-6">
      <i class="fa-solid ${icon} me-2"></i>${verdict}
    </div>
    ${progressHtml}
  `;
}

/**
 * Clear all result sections from previous runs/submissions
 */
function clearResults() {
  // Hide all result sections
  document.getElementById('outputSection').style.display = 'none';
  document.getElementById('expectedSection').style.display = 'none';
  document.getElementById('errorSection').style.display = 'none';
  document.getElementById('stderrSection').style.display = 'none';
  document.getElementById('verdict').innerHTML = '';

  // Clear text content
  document.getElementById('output').textContent = '';
  document.getElementById('expectedOutput').textContent = '';
  document.getElementById('errorMessage').textContent = '';
  document.getElementById('stderrMessage').textContent = '';
}

/**
 * Load sample code based on selected language
 * Helps users get started quickly
 */
document.getElementById('language')?.addEventListener('change', function() {
  const samples = {
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    javascript: 'console.log("Hello, World!");',
    python: 'print("Hello, World!")',
  };

  // Only fill code area if it's empty
  const codeArea = document.getElementById('code');
  if (codeArea && codeArea.value.trim() === '') {
    codeArea.value = samples[this.value] || '';
  }
});
