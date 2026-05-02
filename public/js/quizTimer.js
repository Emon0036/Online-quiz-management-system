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

    if (typeof quizForm.requestSubmit === 'function') quizForm.requestSubmit();
    else quizForm.submit();
  }

  const interval = setInterval(() => {
    remaining -= 1;
    const minutes = Math.floor(remaining / 60);
    const seconds = String(remaining % 60).padStart(2, '0');
    timerText.textContent = `${minutes}:${seconds}`;
    syncTimeSpent();

    if (remaining <= 60) timer.classList.add('timer-danger');
    if (remaining <= 0) {
      clearInterval(interval);
      submitNow('time_up');
    }
  }, 1000);

  quizForm.addEventListener('submit', () => {
    alreadySubmitted = true;
    syncTimeSpent();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) submitNow('tab_hidden');
  });

  window.addEventListener('blur', () => submitNow('window_blur'));
}
