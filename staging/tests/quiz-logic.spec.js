import { test, expect } from '@playwright/test';

test('Verify quiz logic', async ({ page }) => {
  await page.goto('/');

  // Wait for the script to load and window.generateQuiz to be available
  await page.waitForFunction(() => typeof window.generateQuiz === 'function');

  const quizzes = await page.evaluate(() => {
    const results = [];
    for (let i = 0; i < 200; i++) {
      results.push(window.generateQuiz());
    }
    return results;
  });

  const types = {
    '+': 0,
    '-': 0,
    '×': 0,
    '÷': 0
  };

  for (const quiz of quizzes) {
    const { expression, answer } = quiz;

    // Parse expression
    // Expected formats: "A + B", "A - B", "A × B", "A ÷ B"
    const parts = expression.split(' ');
    expect(parts.length).toBe(3);
    const [left, op, right] = parts;
    const a = parseInt(left, 10);
    const b = parseInt(right, 10);

    expect(types).toHaveProperty(op);
    types[op]++;

    if (op === '+') {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
      expect(answer).toBe(a + b);
    } else if (op === '-') {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
      expect(answer).toBe(a - b);
      expect(answer).toBeGreaterThanOrEqual(0);
    } else if (op === '×') {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
      expect(answer).toBe(a * b);
    } else if (op === '÷') {
      // dividend ÷ divisor
      // divisor (b) should be 1-9
      // answer should be 1-9 (per generation logic: dividend = divisor * answer)
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
      expect(answer).toBeGreaterThanOrEqual(1);
      expect(answer).toBeLessThanOrEqual(9);
      expect(a).toBe(b * answer);
    }
  }

  // Ensure all types are generated at least once
  console.log('Quiz type distribution:', types);
  expect(types['+']).toBeGreaterThan(0);
  expect(types['-']).toBeGreaterThan(0);
  expect(types['×']).toBeGreaterThan(0);
  expect(types['÷']).toBeGreaterThan(0);
});
