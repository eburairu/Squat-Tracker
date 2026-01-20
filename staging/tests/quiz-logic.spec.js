import { test, expect } from '@playwright/test';

test('Verify quiz logic', async ({ page }) => {
  await page.goto('/');

  // Wait for the script to load and the function to be available
  await page.waitForFunction(() => typeof window.generateQuiz === 'function');

  // Generate multiple quizzes to cover different operations
  const quizzes = await page.evaluate(() => {
    const results = [];
    for (let i = 0; i < 20; i++) {
      results.push(window.generateQuiz());
    }
    return results;
  });

  // Verify the logic of the generated quizzes
  const types = { '+': 0, '-': 0, '×': 0, '÷': 0 };

  for (const quiz of quizzes) {
    const { expression, answer } = quiz;
    const parts = expression.split(' ');
    expect(parts.length).toBe(3);
    const [left, op, right] = parts;
    const a = parseInt(left, 10);
    const b = parseInt(right, 10);

    // Verify operation type is valid
    expect(types).toHaveProperty(op);
    types[op]++;

    // Verify calculation correctness
    if (op === '+') {
      expect(answer).toBe(a + b);
    } else if (op === '-') {
      expect(answer).toBe(a - b);
    } else if (op === '×') {
      expect(answer).toBe(a * b);
    } else if (op === '÷') {
      // For division, we verify the inverse multiplication to avoid float issues
      // app.js logic: dividend = divisor * answer. expression is "dividend ÷ divisor"
      // So a (dividend) should be b (divisor) * answer
      expect(a).toBe(b * answer);
    }
  }

  // Ensure we saw at least one of each type (statistically likely with 20 samples)
  // If this flakes, we might need to increase samples or retry, but 20 samples for 4 types is very safe.
  // Probability of missing one type in 20 tries is very low (~0.3% per type).
  // Let's relax it or just log. But for a robust test, we can check > 0.
  console.log('Quiz types generated:', types);
  expect(types['+']).toBeGreaterThan(0);
  expect(types['-']).toBeGreaterThan(0);
  expect(types['×']).toBeGreaterThan(0);
  expect(types['÷']).toBeGreaterThan(0);
});
