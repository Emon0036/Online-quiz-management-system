const mongoose = require("mongoose");

// Schema for tracking code submissions and their execution results
const submissionSchema = new mongoose.Schema({
    // Reference to the problem being solved
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    // Reference to the user who submitted the code
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // The submitted source code
    code: {
        type: String,
        required: true
    },
    // Programming language (c, cpp, java, javascript, python)
    language: {
        type: String,
        required: true,
        enum: ['c', 'cpp', 'java', 'javascript', 'python']
    },
    // Execution verdict/status (Accepted, Wrong Answer, Runtime Error, Compilation Error)
    verdict: {
        type: String,
        enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 'Pending'],
        default: 'Pending'
    },
    // Standard output from code execution
    output: {
        type: String,
        default: ''
    },
    // Standard error output from code execution
    stderr: {
        type: String,
        default: ''
    },
    // Compilation error output (if compilation failed)
    compileOutput: {
        type: String,
        default: ''
    },
    // Timestamp when submission was made
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);