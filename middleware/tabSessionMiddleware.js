const crypto = require('crypto');

function getTabId(req) {
  if (req.body && req.body.tab) return String(req.body.tab);
  if (req.query && req.query.tab) return String(req.query.tab);
  if (req.headers['x-tab-session']) return String(req.headers['x-tab-session']);
  return null;
}

function generateTabId() {
  return crypto.randomBytes(8).toString('hex');
}

function attachTabUser(req, res, next) {
  const tabId = getTabId(req);
  if (!req.session) {
    req.currentTabId = tabId;
    return next();
  }

  req.session.tabUsers = req.session.tabUsers || {};

  if (tabId) {
    req.currentTabId = tabId;
    req.session.lastActiveTabId = tabId;
    const mappedUserId = req.session.tabUsers[tabId];
    if (mappedUserId) {
      req.session.passport = req.session.passport || {};
      req.session.passport.user = mappedUserId;
    }
  } else if (req.session.lastActiveTabId && req.session.tabUsers[req.session.lastActiveTabId]) {
    req.currentTabId = req.session.lastActiveTabId;
    req.session.passport = req.session.passport || {};
    req.session.passport.user = req.session.tabUsers[req.session.lastActiveTabId];
  }

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
  saveTabUser,
  removeTabUser,
};
