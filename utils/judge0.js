const axios = require("axios");

// Execute code using Judge0 API (online code execution service)
async function executeCode(source_code, language_id) {
    // Check if API key is configured in environment variables
    if (!process.env.JUDGE0_API_KEY) {
        throw new Error('JUDGE0_API_KEY is not configured in environment variables');
    }

    try {
        // Submit code to Judge0 API
        const response = await axios.post(
            "https://judge0-ce.p.rapidapi.com/submissions",
            {
                source_code,
                language_id
            },
            {
                headers: {
                    "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
                    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
                }
            }
        );

        // Return the submission response (includes token for status checking)
        return response.data;
    } catch (error) {
        // Log and rethrow error with descriptive message
        console.error('Judge0 API error:', error.response?.data || error.message);
        throw new Error(`Code execution failed: ${error.response?.data?.error || error.message}`);
    }
}

module.exports = executeCode;