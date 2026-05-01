const timer = document.querySelector('.timer');
const quizForm = document.getElementById('quizForm');
const timerText = document.getElementById('timerText');
const timeSpent = document.getElementById('timeSpent');

if (timer && quizForm && timerText) {
  const totalSeconds = Number(timer.dataset.duration) * 60;
  const startedAt = Date.now();
  let remaining = totalSeconds;

  const interval = setInterval(() => {
    remaining -= 1;
    const minutes = Math.floor(remaining / 60);
    const seconds = String(remaining % 60).padStart(2, '0');
    timerText.textContent = `${minutes}:${seconds}`;
    timeSpent.value = Math.min(totalSeconds, Math.floor((Date.now() - startedAt) / 1000));

    if (remaining <= 60) timer.classList.add('timer-danger');
    if (remaining <= 0) {
      clearInterval(interval);
      quizForm.submit();
    }
  }, 1000);

  quizForm.addEventListener('submit', () => {
    timeSpent.value = Math.min(totalSeconds, Math.floor((Date.now() - startedAt) / 1000));
  });
}
