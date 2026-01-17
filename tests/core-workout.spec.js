const { test, expect } = require('@playwright/test');

test.describe('Core Workout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Complete a 1-set 1-rep workout', async ({ page }) => {
    // Override inputs for speed
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '1');
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#rest-duration', '10'); // Won't be used for 1 set
    // Countdown min is 3
    await page.fill('#countdown-duration', '3');

    // Start
    await page.click('#start-button');

    // Verify Countdown
    await expect(page.locator('#phase-display')).toHaveText('スタート前');

    // Countdown ends after 3s -> DOWN
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ', { timeout: 7000 });

    // Down (1s) -> HOLD
    await expect(page.locator('#phase-display')).toHaveText('キープ', { timeout: 5000 });

    // Hold (1s) -> UP
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 5000 });

    // Up (1s) -> FINISHED (because 1 rep, 1 set)
    await expect(page.locator('#phase-display')).toHaveText('終了', { timeout: 5000 });

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
