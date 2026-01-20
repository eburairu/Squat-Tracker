const { test, expect } = require('@playwright/test');

test.describe('Pause/Resume Timing', () => {
  test('should resume phase with remaining time instead of full duration', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    // Setup workout: Down=5s (Max allowed), Countdown=3s
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '1');
    await page.fill('#down-duration', '5'); // Max is 5
    await page.fill('#hold-duration', '2');
    await page.fill('#up-duration', '2');
    await page.fill('#countdown-duration', '3');

    // Start
    await page.click('#start-button');

    // Advance past countdown (3s) -> Enters DOWN phase
    await page.clock.runFor(3100);
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ');

    // Advance 2s into the 5s DOWN phase
    await page.clock.runFor(2000);
    // Ensure we are STILL in DOWN phase (if duration is 5s, we should be)
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ');

    // Pause
    await page.click('#pause-button');
    await expect(page.locator('#phase-hint')).toHaveText('一時停止中');

    // Simulate long pause (e.g., 60s)
    await page.clock.runFor(60000);

    // Resume
    await page.click('#pause-button');
    await expect(page.locator('#pause-button')).toHaveText('一時停止');

    // Advance 3.1s.
    // Total active time in DOWN = 2s (before pause) + 3.1s (after pause) = 5.1s.
    // Should have transitioned to HOLD (duration 5s).
    // If bug exists, it restarts the 5s timer, so we would need 1.9s more.
    await page.clock.runFor(3100);

    // Check phase immediately (clock is frozen).
    // If correct, we are in HOLD. If bug, we are still in DOWN.
    const text = await page.locator('#phase-display').textContent();
    expect(text).toBe('キープ');
  });
});
