import { getRandomInt } from '../utils.js';

// クイズの状態は app.js で管理するため、このモジュールでは不要
// let currentQuiz = null;
// export const getCurrentQuiz = () => currentQuiz;

/**
 * 新しい計算問題を生成する
 * @returns {object} クイズオブジェクト { problemText, correctAnswer, options, isCritical }
 */
export const generateQuiz = () => {
  const operators = ['+', '-', '×', '÷'];
  const operator = operators[getRandomInt(0, 3)];
  const isCritical = Math.random() < 0.1;

  const getOperand = (allowTwoDigits) => {
    if (allowTwoDigits && Math.random() < 0.3) {
      return getRandomInt(10, 99);
    }
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
  let correctAnswer = 0;

  // 0: Normal, 1: Missing Left, 2: Missing Right
  const questionType = getRandomInt(0, 2);

  if (questionType === 1) { // Missing Left: ? + B = R
    problemText = `? ${operator} ${b} = ${result}`;
    answerText = `? = ${a}`;
    correctAnswer = a;
  } else if (questionType === 2) { // Missing Right: A + ? = R
    problemText = `${a} ${operator} ? = ${result}`;
    answerText = `? = ${b}`;
    correctAnswer = b;
  } else { // Normal: A + B = ?
    problemText = `${a} ${operator} ${b} = ?`;
    answerText = `${result}`;
    correctAnswer = result;
  }

  // Generate Options
  const options = new Set([correctAnswer]);
  while (options.size < 4) {
    const offset = getRandomInt(-10, 10);
    const val = correctAnswer + offset;
    if (val >= 0 && val !== correctAnswer) {
      options.add(val);
    }
  }
  const optionsArray = Array.from(options);
  // Simple shuffle
  for (let i = optionsArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
  }

  return {
    problemText,
    answerText,
    correctAnswer,
    options: optionsArray,
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
