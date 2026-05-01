const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    questionText: { type: String, required: true, trim: true },
    type: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'], required: true },
    options: [{ type: String, trim: true }],
    correctAnswer: { type: String, trim: true },
    marks: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

questionSchema.methods.checkAnswer = function checkAnswer(answer) {
  if (this.type === 'short-answer') return false;
  return String(answer || '').trim().toLowerCase() === String(this.correctAnswer || '').trim().toLowerCase();
};

module.exports = mongoose.model('Question', questionSchema);
