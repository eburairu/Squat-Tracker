import { test, expect } from '@playwright/test';

test('Verify new quiz logic with options', async ({ page }) => {
  await page.goto('/');

  await page.waitForFunction(() => typeof window.generateQuiz === 'function');

  const quizzes = await page.evaluate(() => {
    window.quizMode = 'cooperative'; // Set dummy mode for generateQuiz
    const results = [];
    for (let i = 0; i < 100; i++) {
      results.push(window.generateQuiz());
    }
    return results;
  });

  const types = { '+': 0, '-': 0, '×': 0, '÷': 0 };

  for (const quiz of quizzes) {
    const { problemText, correctAnswer, options } = quiz;

    // 1. Verify options array
    expect(options).toBeInstanceOf(Array);
    expect(options.length).toBe(4);
    expect(options).toContain(correctAnswer);
    // Check for unique options
    const uniqueOptions = new Set(options);
    expect(uniqueOptions.size).toBe(4);

    // 2. Verify calculation logic
    const match = problemText.match(/([\+\-×÷])/);
    expect(match).not.toBeNull();
    const op = match[0];
    types[op]++;

    const parts = problemText.split(' ');
    expect(parts.length).toBe(5);
    const valA = parts[0];
    const valB = parts[2];
    const valR = parts[4];

    let a, b, r;
    if (valA === '?') { // Missing Left
      a = correctAnswer;
      b = parseInt(valB, 10);
      r = parseInt(valR, 10);
    } else if (valB === '?') { // Missing Right
      a = parseInt(valA, 10);
      b = correctAnswer;
      r = parseInt(valR, 10);
    } else { // Normal
      a = parseInt(valA, 10);
      b = parseInt(valB, 10);
      r = correctAnswer;
      expect(valR).toBe('?');
    }

    if (op === '+') expect(a + b).toBe(r);
    else if (op === '-') expect(a - b).toBe(r);
    else if (op === '×') expect(a * b).toBe(r);
    else if (op === '÷') expect(a).toBe(b * r); // a = b * r for division
  }

  // Ensure all operators are tested
  expect(types['+']).toBeGreaterThan(0);
  expect(types['-']).toBeGreaterThan(0);
  expect(types['×']).toBeGreaterThan(0);
  expect(types['÷']).toBeGreaterThan(0);
});
