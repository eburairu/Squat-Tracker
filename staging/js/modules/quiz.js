import { Phase } from '../constants.js';
import { getRandomInt } from '../utils.js';

let currentQuiz = null;

export const getCurrentQuiz = () => currentQuiz;

export const generateQuiz = () => {
  const operators = ['+', '-', '×', '÷'];
  const operator = operators[getRandomInt(0, 3)];
  const isCritical = Math.random() < 0.1;

  // 30% chance for fill-in-the-blank
  const isFillIn = Math.random() < 0.3;
  // 0: Normal, 1: Missing Left, 2: Missing Right
  const quizMode = isFillIn ? getRandomInt(1, 2) : 0;

  const getOperand = (allowTwoDigits) => {
    // 30% chance for 2 digits (10-99) if allowed
    if (allowTwoDigits && Math.random() < 0.3) {
      return getRandomInt(10, 99);
    }
    // Standard: 3-9 (exclude 1, 2)
    return getRandomInt(3, 9);
  };

  let a, b, result;

  if (operator === '+') {
    a = getOperand(true);
    b = getOperand(true);
    result = a + b;
  } else if (operator === '-') {
    // Ensure result is >= 3 to avoid easy "1" or "2" appearing in fill-in-the-blank
    do {
      a = getOperand(true);
      b = getOperand(true);
      if (a < b) [a, b] = [b, a];
      result = a - b;
    } while (result <= 2);
  } else if (operator === '×') {
    a = getOperand(false);
    b = getOperand(false);
    result = a * b;
  } else {
    // Division
    b = getOperand(false);
    result = getOperand(false);
    a = b * result;
  }

  let problemText = '';
  let answerText = '';

  if (quizMode === 1) { // Missing Left: ? + B = R
    problemText = `? ${operator} ${b} = ${result}`;
    answerText = `? = ${a}`;
  } else if (quizMode === 2) { // Missing Right: A + ? = R
    problemText = `${a} ${operator} ? = ${result}`;
    answerText = `? = ${b}`;
  } else { // Normal: A + B = ?
    problemText = `${a} ${operator} ${b} = ?`;
    answerText = `${result}`;
  }

  return {
    problemText,
    answerText,
    isCritical
  };
};

export const updateQuizDisplay = (phaseKey, elements) => {
  const { quizProblem, quizAnswer } = elements;
  if (!quizProblem || !quizAnswer) {
    return;
  }
  if (phaseKey === Phase.DOWN) {
    currentQuiz = generateQuiz();
  }

  // Clear critical style by default
  quizProblem.classList.remove('critical-quiz');

  if (phaseKey === Phase.DOWN || phaseKey === Phase.HOLD) {
    const quiz = currentQuiz ?? generateQuiz();
    currentQuiz = quiz;

    // Apply critical style if needed
    if (quiz.isCritical) {
      quizProblem.classList.add('critical-quiz');
    }

    quizProblem.textContent = `問題: ${quiz.problemText}`;
    quizAnswer.textContent = '答え: --';
    return;
  }
  if (phaseKey === Phase.UP && currentQuiz) {
    // Keep critical style visible during answer phase
    if (currentQuiz && currentQuiz.isCritical) {
      quizProblem.classList.add('critical-quiz');
    }

    quizProblem.textContent = `問題: ${currentQuiz ? currentQuiz.problemText : '--'}`;
    quizAnswer.textContent = `答え: ${currentQuiz ? currentQuiz.answerText : '--'}`;
    return;
  }
  quizProblem.textContent = '問題: --';
  quizAnswer.textContent = '答え: --';
};
