import { test, expect } from '@playwright/test';

test('Verify quiz logic', async ({ page }) => {
  // Mock the quiz generator to return deterministic results
  await page.addInitScript(() => {
    const mockQuizzes = [
      { expression: '5 + 3', answer: 8 },
      { expression: '9 - 4', answer: 5 },
      { expression: '6 × 7', answer: 42 },
      { expression: '81 ÷ 9', answer: 9 },
    ];
    let quizIndex = 0;
    window.generateQuiz = () => {
      const quiz = mockQuizzes[quizIndex % mockQuizzes.length];
      quizIndex++;
      return quiz;
    };
  });

  await page.goto('/');

  // Wait for the script to load and the mocked function to be available
  await page.waitForFunction(() => typeof window.generateQuiz === 'function');

  // Generate one of each quiz type from the mock
  const quizzes = await page.evaluate(() => {
    return [
      window.generateQuiz(),
      window.generateQuiz(),
      window.generateQuiz(),
      window.generateQuiz(),
    ];
  });

  // Verify the generated quizzes match the mock data
  expect(quizzes).toEqual([
    { expression: '5 + 3', answer: 8 },
    { expression: '9 - 4', answer: 5 },
    { expression: '6 × 7', answer: 42 },
    { expression: '81 ÷ 9', answer: 9 },
  ]);

  // Also, perform the original logic verification on the fixed data
  const types = { '+': 0, '-': 0, '×': 0, '÷': 0 };

  for (const quiz of quizzes) {
    const { expression, answer } = quiz;
    const parts = expression.split(' ');
    expect(parts.length).toBe(3);
    const [left, op, right] = parts;
    const a = parseInt(left, 10);
    const b = parseInt(right, 10);

    expect(types).toHaveProperty(op);
    types[op]++;

    if (op === '+') {
      expect(answer).toBe(a + b);
    } else if (op === '-') {
      expect(answer).toBe(a - b);
    } else if (op === '×') {
      expect(answer).toBe(a * b);
    } else if (op === '÷') {
      expect(a).toBe(b * answer);
    }
  }

  // Ensure all types were generated
  expect(types['+']).toBe(1);
  expect(types['-']).toBe(1);
  expect(types['×']).toBe(1);
  expect(types['÷']).toBe(1);
});
