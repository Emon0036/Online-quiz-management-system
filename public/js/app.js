document.querySelectorAll('.question-type').forEach((select) => {
  const form = select.closest('form');
  const optionsBox = form.querySelector('.options-box');
  const answerInput = form.querySelector('[name="correctAnswer"]');

  function syncQuestionFields() {
    if (select.value === 'short-answer') {
      optionsBox.classList.add('d-none');
      answerInput.placeholder = 'Expected answer or teacher notes';
    } else if (select.value === 'true-false') {
      optionsBox.classList.add('d-none');
      answerInput.placeholder = 'Type True or False';
    } else {
      optionsBox.classList.remove('d-none');
      answerInput.placeholder = 'Type the exact correct option text';
    }
  }

  select.addEventListener('change', syncQuestionFields);
  syncQuestionFields();
});
