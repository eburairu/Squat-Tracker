import { test, expect } from '@playwright/test';

test.describe('Quiz Stats & Bonus Accumulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#boss-name:not(:text("Loading..."))');

    // Configure workout for testing
    // Short phases to speed up test
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
  });

  test('Quiz Stats should update and Bonus should accumulate', async ({ page }) => {
    // Check initial stats
    await expect(page.locator('#quiz-stats-display')).toHaveText('0 / 0');

    // Start workout
    await page.click('#start-button');

    // --- Rep 1 ---
    // Wait for quiz generation (Down phase)
    await page.waitForSelector('#quiz-problem:not(:text("問題: --"))');

    // Stats should be 0 / 1
    await expect(page.locator('#quiz-stats-display')).toHaveText('0 / 1');

    // Get correct answer
    const correctAns1 = await page.evaluate(() => window.currentQuiz.correctAnswer);
    await page.click(`.quiz-option:text-is("${correctAns1}")`);

    // Wait for UP phase (grading)
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 5000 });

    // Stats should be 1 / 1
    await expect(page.locator('#quiz-stats-display')).toHaveText('1 / 1');

    // Check Bonus = 1
    let bonus = await page.evaluate(() => window.sessionAttackBonus);
    expect(bonus).toBe(1);

    // --- Rep 2 ---
    // Wait for next Down phase (Next question)
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ', { timeout: 5000 });

    // Verify Answer Display Cleared
    await expect(page.locator('#quiz-answer')).toHaveText('答え: --');

    // Stats should be 1 / 2
    await expect(page.locator('#quiz-stats-display')).toHaveText('1 / 2');

    // Get correct answer for Rep 2
    const correctAns2 = await page.evaluate(() => window.currentQuiz.correctAnswer);
    await page.click(`.quiz-option:text-is("${correctAns2}")`);

    // Wait for UP phase
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 5000 });

    // Stats should be 2 / 2
    await expect(page.locator('#quiz-stats-display')).toHaveText('2 / 2');

    // Check Bonus = 2 (Accumulated)
    bonus = await page.evaluate(() => window.sessionAttackBonus);
    expect(bonus).toBe(2);
  });

  test('Quiz Stats should count total even if wrong answer', async ({ page }) => {
    await page.click('#start-button');

    // Rep 1
    await page.waitForSelector('#quiz-problem:not(:text("問題: --"))');
    await expect(page.locator('#quiz-stats-display')).toHaveText('0 / 1');

    // Click WRONG answer
    const correctAns = await page.evaluate(() => window.currentQuiz.correctAnswer);
    const options = await page.evaluate(() => window.currentQuiz.options);
    const wrongAns = options.find(o => o !== correctAns);
    await page.click(`.quiz-option:text-is("${wrongAns}")`);

    // Wait for UP phase
    await expect(page.locator('#phase-display')).toHaveText('立つ');

    // Stats should be 0 / 1
    await expect(page.locator('#quiz-stats-display')).toHaveText('0 / 1');
  });

  test('Quiz location verification', async ({ page }) => {
      // Verify #quiz-card is between #mission-card and #boss-card
      // We can check bounding boxes or simple DOM order via evaluate
      const order = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.app .grid.primary-grid .card'));
          const ids = cards.map(c => c.id);
          return ids;
      });

      // Expected order in primary-grid: mission-card, quiz-card, boss-card, workout-card, control-card
      // Note: workout-card and control-card might not have IDs in original code?
      // workout-card has class but no ID in original code.
      // boss-card has ID. mission-card has ID.
      // quiz-card has ID.

      expect(order).toContain('mission-card');
      expect(order).toContain('quiz-card');
      expect(order).toContain('boss-card');

      const missionIndex = order.indexOf('mission-card');
      const quizIndex = order.indexOf('quiz-card');
      const bossIndex = order.indexOf('boss-card');

      expect(quizIndex).toBeGreaterThan(missionIndex);
      expect(bossIndex).toBeGreaterThan(quizIndex);
  });
});
