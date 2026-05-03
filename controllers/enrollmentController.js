const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const GlobalLeaderboard = require('../models/GlobalLeaderboard');
const Attempt = require('../models/Attempt');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');

/**
 * Get available quizzes by category for student enrollment
 */
exports.browseQuizzes = async (req, res) => {
  try {
    const { category, difficulty, type } = req.query;
    
    const filter = { status: 'published' };
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (difficulty) filter.difficulty = difficulty;
    if (type && type !== 'all') filter.examType = type;

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'name')
      .sort('-createdAt');

    // Get student's enrollments
    const enrollments = await Enrollment.find({ student: req.user._id });
    const enrolledQuizIds = enrollments.map(e => e.quiz.toString());

    // Get categories
    const categories = await Quiz.distinct('category', { status: 'published' });

    res.render('student/quizzes', {
      title: 'Browse Exams',
      quizzes,
      categories,
      selectedCategory: category || 'all',
      selectedDifficulty: difficulty || '',
      selectedType: type || 'all',
      enrolledQuizIds,
      query: req.query,
    });
  } catch (error) {
    console.error('Error browsing quizzes:', error.message);
    req.flash('error', 'Failed to load quizzes');
    res.redirect('/student/dashboard');
  }
};

/**
 * Enroll student in a quiz
 */
exports.enrollQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      req.flash('error', 'Quiz not found');
      return res.redirect('/student/quizzes');
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      student: req.user._id,
      quiz: quizId,
    });

    if (existing) {
      req.flash('success', 'You are already enrolled in this exam.');
      return res.redirect('/enrollments/my-quizzes');
    }

    // Create enrollment
    await Enrollment.create({
      student: req.user._id,
      quiz: quizId,
    });

    // Update progress
    const progress = await Progress.findOneAndUpdate(
      { student: req.user._id },
      { $setOnInsert: { student: req.user._id } },
      { upsert: true, new: true }
    );
    progress.totalQuizzes += 1;
    progress.inProgressQuizzes += 1;

    // Update category progress
    const categoryIndex = progress.quizzesByCategory.findIndex((item) => item.category === quiz.category);
    if (categoryIndex > -1) {
      progress.quizzesByCategory[categoryIndex].total += 1;
    } else {
      progress.quizzesByCategory.push({
        category: quiz.category,
        total: 1,
        completed: 0,
        averageScore: 0,
      });
    }

    await progress.save();

    req.flash('success', `Enrolled in "${quiz.title}"`);
    res.redirect('/enrollments/my-quizzes');
  } catch (error) {
    console.error('Error enrolling in quiz:', error.message);
    req.flash('error', 'Failed to enroll in quiz');
    res.redirect('/enrollments/browse');
  }
};

/**
 * Get student's enrolled quizzes by category
 */
exports.getEnrolledQuizzes = async (req, res) => {
  try {
    const selectedType = String(req.query.type || 'all');
    const includeCoding = selectedType === 'all' || selectedType === 'coding-test';
    const includeQuizzes = selectedType !== 'coding-test';

    const grouped = { quiz: [], 'true-false': [], 'short-answer': [], 'coding-test': [] };

    let codingProblems = [];

    const [enrollments, problems, recentSubmissions] = await Promise.all([
      includeQuizzes
        ? Enrollment.find({ student: req.user._id })
            .populate({
              path: 'quiz',
              match: { status: 'published' },
              select: 'title category examType difficulty duration totalMarks passingMarks',
              populate: { path: 'createdBy', select: 'name' },
            })
            .populate({ path: 'bestAttemptId', select: 'score percentage' })
        : Promise.resolve([]),
      includeCoding ? Problem.find({}).sort('-createdAt').limit(50) : Promise.resolve([]),
      includeCoding
        ? Submission.find({ student: req.user._id })
            .sort('-submittedAt')
            .limit(200)
            .populate('problem', 'title difficulty')
        : Promise.resolve([]),
    ]);

    enrollments.forEach((enrollment) => {
      if (!enrollment.quiz) return;
      const examType = enrollment.quiz.examType || 'quiz';
      if (selectedType !== 'all' && examType !== selectedType) return;
      if (grouped[examType]) grouped[examType].push(enrollment);
    });

    if (includeCoding) {
      const latestSubmissionByProblemId = new Map();
      recentSubmissions.forEach((submission) => {
        const problemId = submission.problem?._id || submission.problem;
        if (!problemId) return;
        const key = String(problemId);
        if (!latestSubmissionByProblemId.has(key)) latestSubmissionByProblemId.set(key, submission);
      });

      codingProblems = problems.map((problem) => ({
        problem,
        latestSubmission: latestSubmissionByProblemId.get(String(problem._id)) || null,
      }));
    }

    res.render('student/my-quizzes', {
      title: 'My Exams',
      groupedEnrollments: grouped,
      selectedType,
      codingProblems,
    });
  } catch (error) {
    console.error('Error fetching enrolled quizzes:', error.message);
    req.flash('error', 'Failed to load quizzes');
    res.redirect('/student/dashboard');
  }
};

/**
 * Get student progress
 */
exports.getProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne({ student: req.user._id });
    if (!progress) progress = await Progress.create({ student: req.user._id });

    res.render('student/progress', {
      title: 'Your Progress',
      progress,
    });
  } catch (error) {
    console.error('Error fetching progress:', error.message);
    req.flash('error', 'Failed to load progress');
    res.redirect('/student/dashboard');
  }
};

/**
 * Get global leaderboard with top students
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 50;
    const skip = (page - 1) * limit;

    // Get top students
    const topStudents = await GlobalLeaderboard.find()
      .populate('student', 'name profileImage')
      .sort({ totalPoints: -1, averageScore: -1 })
      .limit(limit)
      .skip(skip);

    // Calculate ranks
    topStudents.forEach((entry, index) => {
      entry.rank = skip + index + 1;
    });

    // Get current user's rank
    let userLeaderboard = await GlobalLeaderboard.findOne({ student: req.user._id });
    if (!userLeaderboard) userLeaderboard = await GlobalLeaderboard.create({ student: req.user._id });
    const userRank = await GlobalLeaderboard.countDocuments({
      $or: [
        { totalPoints: { $gt: userLeaderboard.totalPoints || 0 } },
        {
          totalPoints: userLeaderboard.totalPoints || 0,
          averageScore: { $gt: userLeaderboard.averageScore || 0 },
        },
      ],
    }) + 1;

    const totalStudents = await GlobalLeaderboard.countDocuments();

    res.render('student/global-leaderboard', {
      title: 'Global Leaderboard',
      topStudents: topStudents.map((entry, index) => ({
        ...entry.toObject(),
        badge: entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : entry.rank <= 5 ? 'top5' : '',
      })),
      userRank,
      userLeaderboard,
      currentPage: page,
      totalPages: Math.ceil(totalStudents / limit),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error.message);
    req.flash('error', 'Failed to load leaderboard');
    res.redirect('/student/dashboard');
  }
};
