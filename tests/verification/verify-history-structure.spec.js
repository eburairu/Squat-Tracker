import { test, expect } from '@playwright/test';

test('History entry should contain timeline data', async ({ page }) => {
  // 1. Open App
  await page.goto('http://127.0.0.1:4173/index.html');

  // 2. Set short duration for quick test
  await page.fill('#down-duration', '1');
  await page.fill('#hold-duration', '1');
  await page.fill('#up-duration', '1');
  await page.fill('#rest-duration', '1');
  await page.fill('#countdown-duration', '1');
  await page.fill('#set-count', '1');
  await page.fill('#rep-count', '2');

  // Trigger input events manually just in case
  await page.dispatchEvent('#set-count', 'input');
  await page.dispatchEvent('#rep-count', 'input');

  // 3. Start Workout
  // Wait for app initialization (data loading)
  await expect(page.locator('#mission-list-weekly .mission-loading')).not.toBeVisible({ timeout: 20000 });

  // Call startWorkout directly to bypass UI state issues
  await page.evaluate(() => {
    window.startWorkout();
  });

  const startButton = page.locator('#start-button');

  // 4. Wait for workout to finish
  // Wait for the button text to change to "進行中" first to ensure it started
  await expect(startButton).toHaveText('進行中', { timeout: 5000 });

  // Wait for phase to be finished
  await expect(page.locator('#phase-display')).toHaveText('終了', { timeout: 30000 });

  // 5. Check LocalStorage
  const history = await page.evaluate(() => {
    const raw = localStorage.getItem('squat-tracker-history-v1');
    return JSON.parse(raw || '[]');
  });

  expect(history.length).toBeGreaterThan(0);
  const latestEntry = history[0];

  console.log('Latest Entry:', latestEntry);

  // 6. Verify Timeline
  expect(latestEntry).toHaveProperty('timeline');
  expect(Array.isArray(latestEntry.timeline)).toBe(true);
  expect(latestEntry.timeline.length).toBeGreaterThan(0);
  expect(typeof latestEntry.timeline[0]).toBe('number');
});
