import { test, expect } from '@playwright/test';

test.describe('Disruptive Mode Logic Change', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#boss-name:not(:text("Loading..."))');

    // Configure workout for fast testing
    const inputs = {
      '#set-count': '1',
      '#rep-count': '5',
      '#down-duration': '1',
      '#hold-duration': '1',
      '#up-duration': '1',
      '#rest-duration': '10',
      '#countdown-duration': '3'
    };

    for (const [selector, value] of Object.entries(inputs)) {
      await page.fill(selector, value);
      await page.locator(selector).dispatchEvent('input');
    }

    // Enable Disruptive Mode
    // Wait for animation
    await page.waitForTimeout(1000);
    // Click the label wrapper instead of the hidden input
    await page.locator('label:has(#quiz-mode-toggle)').click();
    await expect(page.locator('#quiz-mode-label')).toHaveText('お邪魔');
  });

  test('Correct answer should BLOCK progress (Rep count remains same)', async ({ page }) => {
    // Start workout
    await page.click('#start-button');

    // Wait for quiz options (Down phase)
    await page.waitForSelector('#quiz-options-container');

    // Wait until quiz is generated (problem text is not empty/default)
    await page.waitForFunction(() => {
        const problem = document.getElementById('quiz-problem');
        return problem && problem.textContent.includes('問題:') && !problem.textContent.includes('--');
    });

    // Get correct answer
    const correctAns = await page.evaluate(() => window.currentQuiz.correctAnswer);

    // Click correct answer
    await page.click(`.quiz-option:text-is("${correctAns}")`);

    // Wait for cycle to complete (Down 1 + Hold 1 + Up 1 = 3s)
    // Adding buffer
    await page.waitForTimeout(4000);

    // Verify Rep Display is STILL 1 (Progress Blocked)
    await expect(page.locator('#rep-display')).toHaveText('1 / 5');

    // Optional: Check toast or status if implemented
  });

  test('Incorrect answer should ALLOW progress (Rep count increments)', async ({ page }) => {
    // Start workout
    await page.click('#start-button');

    // Wait for quiz options
    await page.waitForSelector('#quiz-options-container');

    // Wait until quiz is generated
    await page.waitForFunction(() => {
        const problem = document.getElementById('quiz-problem');
        return problem && problem.textContent.includes('問題:') && !problem.textContent.includes('--');
    });

    // Get incorrect answer
    const correctAns = await page.evaluate(() => window.currentQuiz.correctAnswer);
    const options = await page.evaluate(() => window.currentQuiz.options);
    const incorrectAns = options.find(o => o !== correctAns);

    // Click incorrect answer
    await page.click(`.quiz-option:text-is("${incorrectAns}")`);

    // Wait for cycle to complete
    await page.waitForTimeout(4000);

    // Verify Rep Display incremented to 2 (Progress Allowed)
    await expect(page.locator('#rep-display')).toHaveText('2 / 5');
  });
});
