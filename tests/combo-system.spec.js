const { test, expect } = require('@playwright/test');

test.describe('Combo System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should increment combo on rep completion', async ({ page }) => {
    // Setup durations for consistent testing
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '5');
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#countdown-duration', '3'); // Min is 3

    // Start workout
    await expect(page.locator('#start-button')).toBeEnabled();
    await page.click('#start-button');

    // Check initial state (invisible or 0)
    const comboDisplay = page.locator('#combo-display');
    await expect(comboDisplay).toHaveCSS('opacity', '0');

    // Wait for 1 Combo!
    await expect(comboDisplay).toContainText('1 Combo!', { timeout: 10000 });

    // Wait for next cycle to start (Phase: DOWN / しゃがむ)
    // Note: It might transition very fast, so we check if it eventually becomes 'しゃがむ'
    // or if we are already in it.
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ', { timeout: 5000 });

    // Answer quiz for 2nd rep
    await page.waitForTimeout(500); // Wait for quiz generation
    await page.evaluate(() => {
        const correct = window.currentQuiz.correctAnswer;
        const buttons = Array.from(document.querySelectorAll('.quiz-option'));
        const target = buttons.find(b => Number(b.textContent) === correct);
        if (target) target.click();
    });

    // Wait for 2 Combo!
    await expect(comboDisplay).toContainText('2 Combo!', { timeout: 10000 });
  });

  test('should reset combo on pause', async ({ page }) => {
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '5');
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#countdown-duration', '3');

    await expect(page.locator('#start-button')).toBeEnabled();
    await page.click('#start-button');

    // Wait for countdown + 1 rep
    await page.waitForTimeout(7000);
    await expect(page.locator('#combo-display')).toContainText('1 Combo!');

    await page.click('#pause-button');

    // Should be hidden or reset
    await expect(page.locator('#combo-display')).toHaveCSS('opacity', '0');
  });

  test('full flow: gain combo then lose it on wrong quiz', async ({ page }) => {
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '5');
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#countdown-duration', '3');

    await expect(page.locator('#start-button')).toBeEnabled();
    await page.click('#start-button');

    // Wait for countdown to finish (3s) + enter 1st DOWN phase (start of cycle)
    await page.waitForTimeout(3500);

    // Answer correctly
    await page.evaluate(() => {
        const correct = window.currentQuiz.correctAnswer;
        const buttons = Array.from(document.querySelectorAll('.quiz-option'));
        const target = buttons.find(b => Number(b.textContent) === correct);
        if (target) target.click();
    });

    // Wait for finish 1st rep (remaining 2s of DOWN + 1s HOLD + 1s UP)
    await page.waitForTimeout(3500);
    await expect(page.locator('#combo-display')).toContainText('1 Combo!');

    // --- 2nd Rep: Fail Quiz ---
    // Wait for 2nd DOWN phase
    await page.waitForTimeout(500);

    // Answer incorrectly
    await page.evaluate(() => {
        const correct = window.currentQuiz.correctAnswer;
        const buttons = Array.from(document.querySelectorAll('.quiz-option'));
        const target = buttons.find(b => Number(b.textContent) !== correct);
        if (target) target.click();
    });

    // Wait for UP phase (result reveal)
    await page.waitForTimeout(2500);

    // Should be reset (invisible)
    await expect(page.locator('#combo-display')).toHaveCSS('opacity', '0');
  });
});
