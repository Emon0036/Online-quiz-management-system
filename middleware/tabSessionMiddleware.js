const crypto = require('crypto');
const User = require('../models/User');

const GUEST_AUTH_ROUTES = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
]);

function getTabId(req) {
  if (req.body && req.body.tab) return String(req.body.tab);
  if (req.query && req.query.tab) return String(req.query.tab);
  if (req.headers['x-tab-session']) return String(req.headers['x-tab-session']);
  return null;
}

function generateTabId() {
  return crypto.randomBytes(8).toString('hex');
}

function isGuestAuthRoute(req) {
  if (!req || !req.path) return false;
  return GUEST_AUTH_ROUTES.has(req.path) || req.path.startsWith('/auth/reset-password/');
}

function attachTabUser(req, res, next) {
  const tabId = getTabId(req);
  if (!req.session) {
    req.currentTabId = tabId || (isGuestAuthRoute(req) ? generateTabId() : null);
    req.currentTabUserId = null;
    return next();
  }

  req.session.tabUsers = req.session.tabUsers || {};
  req.currentTabUserId = null;

  if (tabId) {
    req.currentTabId = tabId;
    req.session.lastActiveTabId = tabId;
    req.currentTabUserId = req.session.tabUsers[tabId] || null;
  } else if (isGuestAuthRoute(req)) {
    req.currentTabId = generateTabId();
  } else if (req.session.lastActiveTabId && req.session.tabUsers[req.session.lastActiveTabId]) {
    req.currentTabId = req.session.lastActiveTabId;
    req.currentTabUserId = req.session.tabUsers[req.session.lastActiveTabId];
  }

  next();
}

async function resolveTabUser(req, res, next) {
  if (!req.currentTabId) {
    return next();
  }

  const scopedUserId = req.session?.tabUsers?.[req.currentTabId] || req.currentTabUserId || null;
  if (!scopedUserId) {
    req.user = null;
    req.isAuthenticated = () => false;
    return next();
  }

  const currentUserId = req.user && (req.user.id || req.user._id) ? String(req.user.id || req.user._id) : null;
  if (currentUserId !== String(scopedUserId)) {
    req.user = await User.findById(scopedUserId);
  }

  req.isAuthenticated = () => Boolean(req.user);
  next();
}

function saveTabUser(req, userId, tabId) {
  if (!req.session) return;
  req.session.tabUsers = req.session.tabUsers || {};
  req.session.tabUsers[tabId] = userId;
  req.session.lastActiveTabId = tabId;
  req.currentTabId = tabId;
  req.session.passport = req.session.passport || {};
  req.session.passport.user = userId;
}

function removeTabUser(req, tabId) {
  if (!req.session || !tabId) return;
  req.session.tabUsers = req.session.tabUsers || {};

  const removedUserId = req.session.tabUsers[tabId];
  delete req.session.tabUsers[tabId];

  const remainingIds = Object.values(req.session.tabUsers || {});
  if (remainingIds.length) {
    req.session.passport = req.session.passport || {};
    req.session.passport.user = remainingIds[0];
  } else if (req.session.passport) {
    delete req.session.passport.user;
  }

  if (req.session.lastActiveTabId === tabId) {
    req.session.lastActiveTabId = remainingIds.length ? Object.keys(req.session.tabUsers)[0] : null;
  }

  return removedUserId;
}

module.exports = {
  getTabId,
  generateTabId,
  attachTabUser,
  resolveTabUser,
  saveTabUser,
  removeTabUser,
};
