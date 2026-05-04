(function initThemeToggle() {
  const STORAGE_KEY = 'quizAppTheme';
  const DARK_CLASS = 'theme-dark';
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function getTheme() {
    return document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light';
  }

  function updateThemeButtons(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const icon = button.querySelector('[data-theme-icon]');
      const label = button.querySelector('[data-theme-label]');
      const isDark = theme === 'dark';

      if (icon) {
        icon.classList.toggle('fa-moon', !isDark);
        icon.classList.toggle('fa-sun', isDark);
      }

      if (label) {
        label.textContent = isDark ? 'Light mode' : 'Dark mode';
      }

      button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function applyTheme(theme) {
    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    const isDark = normalizedTheme === 'dark';

    document.documentElement.classList.toggle(DARK_CLASS, isDark);
    document.documentElement.dataset.theme = normalizedTheme;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

    if (themeMeta) {
      themeMeta.setAttribute('content', isDark ? '#1f2d33' : '#0e4b78');
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, normalizedTheme);
    } catch {}

    updateThemeButtons(normalizedTheme);
  }

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  applyTheme(getTheme());
})();

(function initTabSession() {
  const STORAGE_KEY = 'quizAppTabId';
  const WINDOW_NAME_PREFIX = 'quizapp-tab:';
  const url = new URL(window.location.href);
  const urlTab = url.searchParams.get('tab');
  const storedTab = window.sessionStorage.getItem(STORAGE_KEY);
  const bodyTab = document.body.dataset.currentTabId || '';
  const namedTab = window.name.startsWith(WINDOW_NAME_PREFIX)
    ? window.name.slice(WINDOW_NAME_PREFIX.length)
    : '';
  let tabId = namedTab || storedTab || urlTab || bodyTab;

  if (!tabId) {
    tabId = `tab-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
  }

  window.sessionStorage.setItem(STORAGE_KEY, tabId);
  window.name = `${WINDOW_NAME_PREFIX}${tabId}`;

  if (urlTab !== tabId) {
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url.toString());
  }

  function isInternalLink(href) {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return false;
    try {
      const link = new URL(href, window.location.href);
      return link.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function appendTabParam(link) {
    try {
      const href = link.getAttribute('href');
      if (!isInternalLink(href)) return;
      const linkUrl = new URL(href, window.location.href);
      if (
        linkUrl.pathname === '/auth/login' ||
        linkUrl.pathname === '/auth/register' ||
        linkUrl.pathname === '/auth/forgot-password' ||
        linkUrl.pathname.startsWith('/auth/reset-password/')
      ) {
        linkUrl.searchParams.delete('tab');
        link.setAttribute('href', `${linkUrl.pathname}${linkUrl.search}${linkUrl.hash}`);
        return;
      }
      if (!linkUrl.searchParams.get('tab')) {
        linkUrl.searchParams.set('tab', tabId);
        link.setAttribute('href', linkUrl.toString());
      }
    } catch {}
  }

  function appendTabInput(form) {
    const action = form.getAttribute('action') || window.location.pathname;
    if (!isInternalLink(action)) return;
    let input = form.querySelector('input[name="tab"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'tab';
      form.appendChild(input);
    }
    input.value = tabId;
  }

  document.querySelectorAll('a[href]').forEach((link) => appendTabParam(link));
  document.querySelectorAll('form').forEach((form) => appendTabInput(form));

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href]').forEach((link) => appendTabParam(link));
    document.querySelectorAll('form').forEach((form) => appendTabInput(form));
  });
})();

(function initTeacherQuestionForm() {
  const form = document.querySelector('.modern-question-form');
  if (!form) return;

  const questionTypeField = form.querySelector('.question-type');
  const optionsBox = form.querySelector('#optionsBox');
  const codingFields = form.querySelector('#codingFields');
  const textAnswerField = form.querySelector('#correctAnswerField');
  const trueFalseAnswerField = form.querySelector('#trueFalseAnswerField');
  const correctAnswerHelp = form.querySelector('#correctAnswerHelp');
  const optionInputs = Array.from(form.querySelectorAll('#optionsBox input'));
  const addQuizTestCaseButton = form.querySelector('#addQuizTestCase');
  const testCasesContainer = form.querySelector('#testCasesContainer');

  if (!questionTypeField) return;

  function setElementVisible(element, visible) {
    if (!element) return;
    element.classList.toggle('d-none', !visible);
  }

  function setFieldEnabled(field, enabled) {
    if (!field) return;
    field.disabled = !enabled;
    field.required = enabled && field.dataset.optional !== 'true';
  }

  function applyQuestionMode() {
    const type = questionTypeField.value;
    const isCoding = type === 'coding';
    const isShortAnswer = type === 'short-answer';
    const isTrueFalse = type === 'true-false';
    const isMultipleChoice = type === 'multiple-choice';

    setElementVisible(optionsBox, isMultipleChoice);
    setElementVisible(codingFields, isCoding);
    setElementVisible(textAnswerField, !isCoding && !isTrueFalse);
    setElementVisible(trueFalseAnswerField, isTrueFalse);

    setFieldEnabled(textAnswerField, !isCoding && !isTrueFalse);
    setFieldEnabled(trueFalseAnswerField, isTrueFalse);
    if (textAnswerField) textAnswerField.required = isMultipleChoice;

    optionInputs.forEach((input) => {
      input.required = isMultipleChoice;
      input.disabled = !isMultipleChoice;
    });

    if (correctAnswerHelp) {
      if (isMultipleChoice) correctAnswerHelp.textContent = 'For multiple choice, this must match one option exactly.';
      else if (isShortAnswer) correctAnswerHelp.textContent = 'Optional teacher note or expected answer for manual review.';
      else if (isTrueFalse) correctAnswerHelp.textContent = 'Choose the correct truth value.';
      else correctAnswerHelp.textContent = 'Coding questions are marked from submitted code and test cases.';
    }

    if (textAnswerField) {
      if (isMultipleChoice) textAnswerField.placeholder = 'Enter the exact correct option text';
      else if (isShortAnswer) textAnswerField.placeholder = 'Expected answer or teacher notes';
    }
  }

  function addTestCase() {
    if (!testCasesContainer) return;
    const testCaseCount = testCasesContainer.children.length;
    const wrapper = document.createElement('div');
    wrapper.className = 'test-case mb-3';
    wrapper.innerHTML = `
      <input class="form-control mb-2" name="testCaseInputs[]" placeholder="Test Input ${testCaseCount + 1}">
      <textarea class="form-control" name="testCaseOutputs[]" rows="2" placeholder="Expected Output ${testCaseCount + 1}"></textarea>
    `;
    testCasesContainer.appendChild(wrapper);
  }

  questionTypeField.addEventListener('change', applyQuestionMode);
  if (addQuizTestCaseButton) addQuizTestCaseButton.addEventListener('click', addTestCase);
  applyQuestionMode();
})();
