const timer = document.querySelector('.timer');
const quizForm = document.getElementById('quizForm');
const timerText = document.getElementById('timerText');
const timeSpent = document.getElementById('timeSpent');
const autoSubmitted = document.getElementById('autoSubmitted');
const autoSubmitReason = document.getElementById('autoSubmitReason');

if (timer && quizForm && timerText) {
  const totalSeconds = Number(timer.dataset.duration) * 60;
  const startedAt = Date.now();
  let remaining = totalSeconds;
  let alreadySubmitted = false;
  let focusLost = false;

  function syncTimeSpent() {
    if (!timeSpent) return;
    timeSpent.value = Math.min(totalSeconds, Math.floor((Date.now() - startedAt) / 1000));
  }

  function submitNow(reason) {
    if (alreadySubmitted) return;
    alreadySubmitted = true;

    syncTimeSpent();
    if (autoSubmitted) autoSubmitted.value = '1';
    if (autoSubmitReason) autoSubmitReason.value = String(reason || 'focus_lost');

    clearInterval(interval);
    clearInterval(focusCheckInterval);

    // Use native submit for automatic submission so required validation does not block it.
    quizForm.noValidate = true;
    quizForm.submit();
  }

  // Timer countdown
  const interval = setInterval(() => {
    remaining -= 1;
    const minutes = Math.floor(remaining / 60);
    const seconds = String(remaining % 60).padStart(2, '0');
    timerText.textContent = `${minutes}:${seconds}`;
    syncTimeSpent();

    if (remaining <= 60) timer.classList.add('timer-danger');
    if (remaining <= 0) {
      submitNow('time_up');
    }
  }, 1000);

  // Continuous focus monitor for tabs, notifications, and app switches
  const focusCheckInterval = setInterval(() => {
    if (alreadySubmitted) return;
    if (!document.hasFocus() || document.visibilityState !== 'visible') {
      submitNow('focus_lost');
    }
  }, 500);

  quizForm.addEventListener('submit', () => {
    alreadySubmitted = true;
    syncTimeSpent();
  });

  // Tab visibility change - auto submit when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !alreadySubmitted) {
      focusLost = true;
      submitNow('tab_hidden');
    }
  });

  // Window blur - auto submit when user switches window
  window.addEventListener('blur', () => {
    if (!alreadySubmitted) {
      focusLost = true;
      submitNow('window_blur');
    }
  });

  // Fallback for modern browsers when page is hidden or closed
  window.addEventListener('pagehide', () => {
    if (!alreadySubmitted) submitNow('page_hide');
  });

  // Prevent right-click and developer tools opening
  document.addEventListener('keydown', (e) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
      e.preventDefault();
      submitNow('dev_tools_attempted');
    }
  });

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Warn before closing/navigating away
  window.addEventListener('beforeunload', (e) => {
    if (!alreadySubmitted) {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam will be auto-submitted.';
    }
  });

  // Prevent back button
  history.pushState(null, null, window.location.href);
  window.addEventListener('popstate', () => {
    history.pushState(null, null, window.location.href);
  });
}

