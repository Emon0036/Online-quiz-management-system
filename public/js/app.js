(() => {
  const root = document.documentElement;
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const sidebar = document.querySelector('[data-sidebar]');

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  document.querySelector('[data-sidebar-toggle]')?.addEventListener('click', () => sidebar?.classList.toggle('open'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  document.querySelectorAll('[data-toast]').forEach((btn) => {
    btn.addEventListener('click', () => showToast(btn.dataset.toast));
  });

  function showToast(message = 'Action completed successfully') {
    const stack = document.querySelector('[data-toast-stack]');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = 'toast-card';
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  document.querySelectorAll('[data-counter]').forEach((counter) => {
    const target = Number(counter.dataset.counter);
    let n = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      n += step;
      if (n >= target) { n = target; clearInterval(timer); }
      counter.textContent = n;
    }, 24);
  });

  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    btn.addEventListener('click', () => document.getElementById(btn.dataset.modalOpen)?.showModal());
  });
  document.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('dialog')?.close());
  });

  document.querySelectorAll('.question-type').forEach((select) => {
    const form = select.closest('form');
    const optionsBox = form?.querySelector('.options-box');
    const answerInput = form?.querySelector('[name="correctAnswer"]');
    if (!form || !optionsBox || !answerInput) return;
    const syncQuestionFields = () => {
      if (select.value === 'short-answer' || select.value === 'true-false') {
        optionsBox.classList.add('d-none');
      } else {
        optionsBox.classList.remove('d-none');
      }
    };
    select.addEventListener('change', syncQuestionFields);
    syncQuestionFields();
  });
})();
