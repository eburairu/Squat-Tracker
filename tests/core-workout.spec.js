const { test, expect } = require('@playwright/test');

test.describe.skip('Core Workout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Complete a 1-set 1-rep workout', async ({ page }) => {
    // Override inputs for speed
    for (const [selector, value] of [
      ['#set-count', '1'],
      ['#rep-count', '1'],
      ['#down-duration', '1'],
      ['#hold-duration', '1'],
      ['#up-duration', '1'],
      ['#rest-duration', '10'],
      ['#countdown-duration', '1']
    ]) {
      await page.locator(selector).fill(value);
      await page.locator(selector).dispatchEvent('input');
    }

    // Manually trigger validation after filling inputs
    await page.evaluate(() => window.updateStartButtonAvailability());

    // Start
    await page.click('#start-button');

    // Verify Countdown
    await expect(page.locator('#phase-display')).toHaveText('スタート前');
    await page.waitForTimeout(1500); // Wait for countdown to finish

    // Check phases
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ');
    await page.waitForTimeout(1000);
    await expect(page.locator('#phase-display')).toHaveText('キープ');
    await page.waitForTimeout(1000);
    await expect(page.locator('#phase-display')).toHaveText('立つ');
    await page.waitForTimeout(1000);
    await expect(page.locator('#phase-display')).toHaveText('終了');

    // Verify Stats
    // Session stats should show 1 completed
    await expect(page.locator('#stats-session-reps')).toHaveText('1');
  });

  test('Input validation prevents start with invalid values', async ({ page }) => {
    await page.fill('#set-count', '0');

    // The start button should be disabled immediately
    await expect(page.locator('#start-button')).toBeDisabled();

    // Verify workout did not start
    await expect(page.locator('#phase-display')).toHaveText('待機中');

    // Verify visual feedback
    await expect(page.locator('#set-count')).toHaveClass(/input-error/);
  });
});
