function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please log in first.');
  return res.redirect('/auth/login');
}

function ensureAuthenticatedApi(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Authentication required' });
}

function dashboardPathFor(user) {
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'teacher') {
    return user.teacherStatus === 'pending' || user.teacherStatus === 'rejected'
      ? '/auth/teacher-pending'
      : '/teacher/dashboard';
  }
  return '/student/dashboard';
}

function ensureGuest(req, res, next) {
  if (!req.isAuthenticated()) return next();
  return res.redirect(dashboardPathFor(req.user));
}

function ensureRole(role) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash('error', 'Please log in first.');
      return res.redirect('/auth/login');
    }

    if (req.user.role !== role) {
      req.flash('error', 'You do not have permission to access that page.');
      return res.status(403).render('error', { title: 'Access denied', message: 'Access denied' });
    }

    if (role === 'teacher' && req.user.teacherStatus && req.user.teacherStatus !== 'approved') {
      return res.redirect('/auth/teacher-pending');
    }

    return next();
  };
}

function ensureAdminOrTeacher(req, res, next) {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Please log in first.');
    return res.redirect('/auth/login');
  }

  if (req.user.role === 'admin') return next();

  if (req.user.role === 'teacher') {
    if (req.user.teacherStatus && req.user.teacherStatus !== 'approved') {
      return res.redirect('/auth/teacher-pending');
    }
    return next();
  }

  req.flash('error', 'You do not have permission to access that page.');
  return res.status(403).render('error', { title: 'Access denied', message: 'Access denied' });
}

module.exports = {
  ensureAuthenticated,
  ensureAuthenticatedApi,
  ensureGuest,
  dashboardPathFor,
  ensureAdmin: ensureRole('admin'),
  ensureTeacher: ensureRole('teacher'),
  ensureStudent: ensureRole('student'),
  ensureAdminOrTeacher,
};
