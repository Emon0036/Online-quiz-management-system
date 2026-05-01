function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please log in first.');
  return res.redirect('/auth/login');
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

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  dashboardPathFor,
  ensureAdmin: ensureRole('admin'),
  ensureTeacher: ensureRole('teacher'),
  ensureStudent: ensureRole('student'),
};
