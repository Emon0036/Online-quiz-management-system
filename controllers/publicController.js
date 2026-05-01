const Quiz = require('../models/Quiz');

exports.home = async (req, res) => {
  const featuredQuizzes = await Quiz.find({ status: 'published' }).sort('-createdAt').limit(6).populate('createdBy', 'name');
  res.render('home', { title: 'Online Quiz Management System', featuredQuizzes });
};

exports.about = (req, res) => res.render('about', { title: 'About' });
