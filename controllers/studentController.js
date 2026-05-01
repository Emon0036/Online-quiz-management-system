const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const Result = require('../models/Result');
const Leaderboard = require('../models/Leaderboard');

exports.dashboard = async (req, res) => {
  const recentAttempts = await Attempt.find({ student: req.user._id }).populate('quiz', 'title category').sort('-submittedAt').limit(5);
  const availableQuizCount = await Quiz.countDocuments({ status: 'published' });
  const completedCount = await Attempt.countDocuments({ student: req.user._id });

  res.render('student/dashboard', {
    title: 'Student Dashboard',
    recentAttempts,
    stats: { availableQuizCount, completedCount },
  });
};

exports.quizList = async (req, res) => {
  const filter = { status: 'published' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;

  const quizzes = await Quiz.find(filter).populate('createdBy', 'name').sort('-createdAt');
  res.render('student/quizzes', { title: 'Available Quizzes', quizzes, query: req.query });
};

exports.takeQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.quizId, status: 'published' }).populate('questions');
  if (!quiz) {
    req.flash('error', 'Quiz is not available.');
    return res.redirect('/student/quizzes');
  }
  return res.render('student/take-quiz', { title: quiz.title, quiz });
};

exports.submitQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.quizId, status: 'published' }).populate('questions');
  if (!quiz) {
    req.flash('error', 'Quiz is not available.');
    return res.redirect('/student/quizzes');
  }

  const submittedAnswers = req.body.answers || {};
  let score = 0;
  let hasManualReview = false;

  const answers = quiz.questions.map((question) => {
    const answer = String(submittedAnswers[question._id] || '').trim();

    if (question.type === 'short-answer') {
      hasManualReview = true;
      return {
        question: question._id,
        answer,
        needsManualReview: true,
        marksObtained: 0,
        isCorrect: false,
      };
    }

    const isCorrect = question.checkAnswer(answer);
    const marksObtained = isCorrect ? question.marks : 0;
    score += marksObtained;
    return { question: question._id, answer, isCorrect, marksObtained, needsManualReview: false };
  });

  const percentage = quiz.totalMarks ? Math.round((score / quiz.totalMarks) * 100) : 0;
  const attempt = await Attempt.create({
    student: req.user._id,
    quiz: quiz._id,
    answers,
    score,
    totalMarks: quiz.totalMarks,
    percentage,
    status: hasManualReview ? 'pending-review' : 'submitted',
    passed: !hasManualReview && percentage >= quiz.passingMarks,
    timeSpent: Number(req.body.timeSpent || 0),
    submittedAt: new Date(),
  });

  await Result.create({
    student: req.user._id,
    quiz: quiz._id,
    attempt: attempt._id,
    marksObtained: score,
    totalMarks: quiz.totalMarks,
    percentage,
    status: hasManualReview ? 'pending-review' : percentage >= quiz.passingMarks ? 'pass' : 'fail',
  });

  if (!hasManualReview) {
    const leaderboard = await Leaderboard.findOneAndUpdate({ quiz: quiz._id }, { $setOnInsert: { quiz: quiz._id } }, { upsert: true, new: true });
    await leaderboard.recordAttempt(req.user._id, score, percentage);
  }

  req.flash('success', hasManualReview ? 'Quiz submitted. Short answers are waiting for teacher review.' : 'Quiz submitted successfully.');
  return res.redirect(`/student/results/${attempt._id}`);
};

exports.result = async (req, res) => {
  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id })
    .populate('quiz')
    .populate('answers.question');
  if (!attempt) {
    req.flash('error', 'Result not found.');
    return res.redirect('/student/history');
  }
  return res.render('student/result', { title: 'Quiz Result', attempt });
};

exports.history = async (req, res) => {
  const attempts = await Attempt.find({ student: req.user._id }).populate('quiz', 'title category passingMarks').sort('-submittedAt');
  res.render('student/history', { title: 'Score History', attempts });
};

exports.leaderboard = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.quizId, status: 'published' });
  if (!quiz) {
    req.flash('error', 'Quiz is not available.');
    return res.redirect('/student/quizzes');
  }
  const leaderboard = await Leaderboard.findOne({ quiz: quiz._id }).populate('entries.student', 'name email profileImage');
  const myEntry = leaderboard?.entries.find((entry) => entry.student._id.toString() === req.user._id.toString());
  res.render('student/leaderboard', { title: 'Leaderboard', quiz, leaderboard, myEntry });
};
