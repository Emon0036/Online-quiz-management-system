const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const Result = require('../models/Result');
const Leaderboard = require('../models/Leaderboard');

async function getTeacherQuiz(quizId, teacherId) {
  return Quiz.findOne({ _id: quizId, createdBy: teacherId }).populate('questions');
}

function normalizeQuestionBody(body) {
  const options = Array.isArray(body.options) ? body.options.filter(Boolean) : [];
  if (body.type === 'true-false') return ['True', 'False'];
  if (body.type === 'multiple-choice') return options;
  return [];
}

function calculateGrade(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

async function recalculateQuizMarks(quizId) {
  const questions = await Question.find({ quiz: quizId });
  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  await Quiz.findByIdAndUpdate(quizId, { questions: questions.map((question) => question._id), totalMarks });
}

exports.dashboard = async (req, res) => {
  const quizzes = await Quiz.find({ createdBy: req.user._id }).sort('-createdAt');
  const quizIds = quizzes.map((quiz) => quiz._id);
  const totalAttempts = await Attempt.countDocuments({ quiz: { $in: quizIds } });
  const pendingReviews = await Attempt.countDocuments({ quiz: { $in: quizIds }, status: 'pending-review' });

  res.render('teacher/dashboard', {
    title: 'Teacher Dashboard',
    quizzes,
    stats: {
      totalQuizzes: quizzes.length,
      publishedQuizzes: quizzes.filter((quiz) => quiz.status === 'published').length,
      draftQuizzes: quizzes.filter((quiz) => quiz.status === 'draft').length,
      totalAttempts,
      pendingReviews,
    },
  });
};

exports.listQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({ createdBy: req.user._id }).sort('-createdAt');
  res.render('teacher/quizzes', { title: 'Manage Quizzes', quizzes });
};

exports.showCreateQuiz = (req, res) => res.render('teacher/quiz-form', { title: 'Create Quiz', quiz: {}, questions: [], action: '/teacher/quizzes' });

exports.createQuiz = async (req, res) => {
  const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id, status: 'draft' });
  await Leaderboard.create({ quiz: quiz._id, entries: [] });
  req.flash('success', 'Quiz created. Add questions next.');
  res.redirect(`/teacher/quizzes/${quiz._id}/edit`);
};

exports.showEditQuiz = async (req, res) => {
  const quiz = await getTeacherQuiz(req.params.quizId, req.user._id);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }
  return res.render('teacher/quiz-form', { title: 'Edit Quiz', quiz, questions: quiz.questions, action: `/teacher/quizzes/${quiz._id}?_method=PUT` });
};

exports.updateQuiz = async (req, res) => {
  const quiz = await Quiz.findOneAndUpdate({ _id: req.params.quizId, createdBy: req.user._id }, req.body, { new: true, runValidators: true });
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }
  req.flash('success', 'Quiz details updated.');
  return res.redirect(`/teacher/quizzes/${quiz._id}/edit`);
};

exports.deleteQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.quizId, createdBy: req.user._id });
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }
  await Promise.all([
    Question.deleteMany({ quiz: quiz._id }),
    Attempt.deleteMany({ quiz: quiz._id }),
    Result.deleteMany({ quiz: quiz._id }),
    Leaderboard.deleteOne({ quiz: quiz._id }),
    Quiz.deleteOne({ _id: quiz._id }),
  ]);
  req.flash('success', 'Quiz deleted.');
  return res.redirect('/teacher/quizzes');
};

exports.togglePublish = async (req, res) => {
  const quiz = await getTeacherQuiz(req.params.quizId, req.user._id);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }
  if (quiz.status === 'draft' && quiz.questions.length === 0) {
    req.flash('error', 'Add at least one question before publishing.');
    return res.redirect('/teacher/quizzes');
  }
  quiz.status = quiz.status === 'published' ? 'draft' : 'published';
  await quiz.save();
  req.flash('success', `Quiz ${quiz.status === 'published' ? 'published' : 'unpublished'}.`);
  return res.redirect('/teacher/quizzes');
};

exports.addQuestion = async (req, res) => {
  const quiz = await getTeacherQuiz(req.params.quizId, req.user._id);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }

  const question = await Question.create({
    quiz: quiz._id,
    questionText: req.body.questionText,
    type: req.body.type,
    options: normalizeQuestionBody(req.body),
    correctAnswer: req.body.correctAnswer,
    marks: Number(req.body.marks || 1),
  });

  quiz.questions.push(question._id);
  quiz.totalMarks += question.marks;
  await quiz.save();
  req.flash('success', 'Question added.');
  return res.redirect(`/teacher/quizzes/${quiz._id}/edit`);
};

exports.deleteQuestion = async (req, res) => {
  const quiz = await getTeacherQuiz(req.params.quizId, req.user._id);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }
  await Question.deleteOne({ _id: req.params.questionId, quiz: quiz._id });
  await recalculateQuizMarks(quiz._id);
  req.flash('success', 'Question removed.');
  return res.redirect(`/teacher/quizzes/${quiz._id}/edit`);
};

exports.attempts = async (req, res) => {
  const quiz = await getTeacherQuiz(req.params.quizId, req.user._id);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }
  const attempts = await Attempt.find({ quiz: quiz._id }).populate('student', 'name email').sort('-submittedAt');
  res.render('teacher/attempts', { title: 'Student Attempts', quiz, attempts });
};

exports.reviewAttempt = async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId).populate('quiz').populate('answers.question').populate('student', 'name email');
  if (!attempt || attempt.quiz.createdBy.toString() !== req.user._id.toString()) {
    req.flash('error', 'Attempt not found.');
    return res.redirect('/teacher/quizzes');
  }
  return res.render('teacher/review-attempt', { title: 'Manual Review', attempt });
};

exports.updateReview = async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId).populate('quiz').populate('answers.question');
  if (!attempt || attempt.quiz.createdBy.toString() !== req.user._id.toString()) {
    req.flash('error', 'Attempt not found.');
    return res.redirect('/teacher/quizzes');
  }

  attempt.answers.forEach((answer, index) => {
    if (answer.needsManualReview) {
      const marks = Number(req.body.marks?.[index] || 0);
      answer.marksObtained = Math.max(0, Math.min(marks, answer.question.marks));
      answer.isCorrect = answer.marksObtained === answer.question.marks;
      answer.needsManualReview = false;
    }
  });

  attempt.score = attempt.answers.reduce((sum, answer) => sum + answer.marksObtained, 0);
  attempt.percentage = attempt.totalMarks ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
  attempt.passed = attempt.percentage >= attempt.quiz.passingMarks;
  attempt.status = 'reviewed';
  await attempt.save();

  await Result.findOneAndUpdate(
    { attempt: attempt._id },
    {
      student: attempt.student,
      quiz: attempt.quiz._id,
      attempt: attempt._id,
      marksObtained: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      status: attempt.passed ? 'pass' : 'fail',
      grade: calculateGrade(attempt.percentage),
    },
    { upsert: true, runValidators: true }
  );

  const leaderboard = await Leaderboard.findOneAndUpdate({ quiz: attempt.quiz._id }, { $setOnInsert: { quiz: attempt.quiz._id } }, { upsert: true, new: true });
  await leaderboard.recordAttempt(attempt.student, attempt.score, attempt.percentage);

  req.flash('success', 'Manual review saved.');
  return res.redirect(`/teacher/quizzes/${attempt.quiz._id}/attempts`);
};

exports.analytics = async (req, res) => {
  const quiz = await getTeacherQuiz(req.params.quizId, req.user._id);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }
  const attempts = await Attempt.find({ quiz: quiz._id });
  const average = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.percentage, 0) / attempts.length) : 0;
  const passCount = attempts.filter((item) => item.passed).length;
  res.render('teacher/analytics', { title: 'Quiz Analytics', quiz, attempts, average, passCount });
};

exports.leaderboard = async (req, res) => {
  const quiz = await getTeacherQuiz(req.params.quizId, req.user._id);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/teacher/quizzes');
  }
  const leaderboard = await Leaderboard.findOne({ quiz: quiz._id }).populate('entries.student', 'name email');
  res.render('teacher/leaderboard', { title: 'Leaderboard', quiz, leaderboard });
};
