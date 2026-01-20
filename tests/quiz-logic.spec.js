import { test, expect } from '@playwright/test';

test('Verify quiz logic', async ({ page }) => {
  await page.goto('/');

  // Wait for the script to load and the function to be available
  await page.waitForFunction(() => typeof window.generateQuiz === 'function');

  // Generate multiple quizzes to cover different operations
  const quizzes = await page.evaluate(() => {
    const results = [];
    for (let i = 0; i < 100; i++) {
      results.push(window.generateQuiz());
    }
    return results;
  });

  // Verify the logic of the generated quizzes
  const types = { '+': 0, '-': 0, '×': 0, '÷': 0 };

  for (const quiz of quizzes) {
    const { problemText, answerText } = quiz;

    // Extract operator
    const match = problemText.match(/([\+\-×÷])/);
    expect(match).not.toBeNull();
    const op = match[0];
    types[op]++;

    const parts = problemText.split(' ');
    // Expect format: "A op B = R"
    expect(parts.length).toBe(5);
    const valA = parts[0];
    const valOp = parts[1];
    const valB = parts[2];
    const valEq = parts[3];
    const valR = parts[4];

    expect(valOp).toBe(op);
    expect(valEq).toBe('=');

    // Extract Answer Value
    let answerVal;
    if (answerText.startsWith('? = ')) {
       answerVal = parseInt(answerText.split(' = ')[1], 10);
    } else {
       answerVal = parseInt(answerText, 10);
    }

    // Verify logic
    let a, b, r;

    if (valA === '?') {
        // Missing Left: ? + B = R
        a = answerVal;
        b = parseInt(valB, 10);
        r = parseInt(valR, 10);
    } else if (valB === '?') {
        // Missing Right: A + ? = R
        a = parseInt(valA, 10);
        b = answerVal;
        r = parseInt(valR, 10);
    } else {
        // Normal: A + B = ?
        a = parseInt(valA, 10);
        b = parseInt(valB, 10);
        r = answerVal;
        expect(valR).toBe('?');
    }

    if (op === '+') {
      expect(a + b).toBe(r);
    } else if (op === '-') {
      expect(a - b).toBe(r);
    } else if (op === '×') {
      expect(a * b).toBe(r);
    } else if (op === '÷') {
      // In app.js: a / b = r (since problem is "a ÷ b")
      expect(a / b).toBe(r);
    }
  }

  expect(types['+']).toBeGreaterThan(0);
  expect(types['-']).toBeGreaterThan(0);
  expect(types['×']).toBeGreaterThan(0);
  expect(types['÷']).toBeGreaterThan(0);
});
