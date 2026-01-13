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
    await page.fill('#countdown-duration', '1');

    // Start
    await page.click('#start-button');

    // Verify Countdown
    await expect(page.locator('#phase-display')).toHaveText('スタート前');

    // Countdown ends after 1s -> DOWN
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ', { timeout: 5000 });

    // Down (1s) -> HOLD
    await expect(page.locator('#phase-display')).toHaveText('キープ', { timeout: 5000 });

    // Hold (1s) -> UP
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 5000 });

    // Up (1s) -> FINISHED (because 1 rep, 1 set)
    await expect(page.locator('#phase-display')).toHaveText('終了', { timeout: 5000 });

    // Verify Stats
    // Session stats should show 1 completed
    await expect(page.locator('#stats-session-reps')).toHaveText('1');

    // Total stats might update (depends on if history was cleared, but it starts at 0 or saved value)
    // Since we just finished one, it should be visible in history if we wait/reload,
    // or just check the total count incremented.
    // Since we don't know the starting state perfectly, let's just check session stats first.
  });

  test('Input validation prevents start with invalid values', async ({ page }) => {
    await page.fill('#set-count', '0');
    await page.click('#start-button');

    await expect(page.locator('#phase-hint')).toContainText('入力値が不正です');
    await expect(page.locator('#phase-display')).toHaveText('待機中');

    // Verify start button is still active/not "In Progress"
    await expect(page.locator('#start-button')).not.toBeDisabled();
  });
});
