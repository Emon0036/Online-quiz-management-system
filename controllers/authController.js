const crypto = require('crypto');
const passport = require('passport');
const validator = require('validator');
const User = require('../models/User');
const { dashboardPathFor } = require('../middleware/authMiddleware');

exports.showRegister = (req, res) => res.render('auth/register', { title: 'Register' });
exports.showLogin = (req, res) => res.render('auth/login', { title: 'Login' });
exports.showForgotPassword = (req, res) => res.render('auth/forgot-password', { title: 'Forgot password' });
exports.showTeacherPending = (req, res) => res.render('auth/teacher-pending', { title: 'Teacher approval' });

exports.register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    req.flash('error', 'Please fill in every required field.');
    return res.redirect('/auth/register');
  }
  if (!validator.isEmail(email)) {
    req.flash('error', 'Please enter a valid email address.');
    return res.redirect('/auth/register');
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/auth/register');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    req.flash('error', 'An account already exists with that email.');
    return res.redirect('/auth/register');
  }

  // All registrations are students. Teachers are created by admins only.
  const newUser = await User.create({
    name,
    email,
    password,
    role: 'student',
    teacherStatus: 'none',
  });

  // Initialize progress and leaderboard for new student
  const Progress = require('../models/Progress');
  const GlobalLeaderboard = require('../models/GlobalLeaderboard');
  
  await Progress.create({ student: newUser._id });
  await GlobalLeaderboard.create({ student: newUser._id });

  req.flash('success', 'Account created successfully! Please log in.');
  return res.redirect('/auth/login');
};

exports.login = [
  passport.authenticate('local', {
    failureRedirect: '/auth/login',
    failureFlash: true,
  }),
  (req, res) => {
    req.flash('success', `Welcome back, ${req.user.name}.`);
    res.redirect(dashboardPathFor(req.user));
  },
];

exports.logout = (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.flash('success', 'You have been logged out.');
    return res.redirect('/');
  });
};

exports.startGoogle = (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

exports.googleCallback = [
  passport.authenticate('google', {
    failureRedirect: '/auth/login',
    failureFlash: true,
  }),
  (req, res) => {
    req.flash('success', `Welcome, ${req.user.name}.`);
    res.redirect(dashboardPathFor(req.user));
  },
];

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (!user) {
    req.flash('success', 'If that email exists, a reset link has been created.');
    return res.redirect('/auth/login');
  }

  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // In production, send this URL by email. During development it is shown for easy testing.
  const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;
  console.log(`Password reset URL: ${resetUrl}`);
  req.flash('success', `Reset link created: ${resetUrl}`);
  return res.redirect('/auth/login');
};

exports.showResetPassword = async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) {
    req.flash('error', 'This reset link is invalid or expired.');
    return res.redirect('/auth/forgot-password');
  }
  return res.render('auth/reset-password', { title: 'Reset password', token: req.params.token });
};

exports.resetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (!password || password !== confirmPassword) {
    req.flash('error', 'Please enter matching passwords.');
    return res.redirect(`/auth/reset-password/${req.params.token}`);
  }

  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) {
    req.flash('error', 'This reset link is invalid or expired.');
    return res.redirect('/auth/forgot-password');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  req.flash('success', 'Password changed. Please log in.');
  return res.redirect('/auth/login');
};
