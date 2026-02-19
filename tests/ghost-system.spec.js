import { test, expect } from '@playwright/test';

test('Ghost system E2E: Display and movement', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/index.html');

  // 1. Initial State: Ghost UI hidden
  await expect(page.locator('#session-progress-wrapper')).not.toBeVisible();

  // 2. Start Workout
  // Wait for loading
  await expect(page.locator('#mission-list-weekly .mission-loading')).not.toBeVisible({ timeout: 20000 });

  // Setup short workout and start
  await page.evaluate(() => {
    document.getElementById('set-count').value = '1';
    document.getElementById('rep-count').value = '2';
    document.getElementById('down-duration').value = '1';
    document.getElementById('hold-duration').value = '1';
    document.getElementById('up-duration').value = '1';
    document.getElementById('rest-duration').value = '1';
    document.getElementById('countdown-duration').value = '1';

    // Trigger input events
    document.getElementById('set-count').dispatchEvent(new Event('input'));

    window.startWorkout();
  });

  // 3. Check UI visible
  await expect(page.locator('#session-progress-wrapper')).toBeVisible();

  // Check markers exist
  // Ghost marker is dynamically created inside container
  // Note: ID is not fixed in GhostManager (defaults to 'ghost-marker' but let's check class)
  const ghostMarker = page.locator('#session-progress-container .ghost-marker');
  const userMarker = page.locator('#user-marker');

  await expect(ghostMarker).toBeAttached();
  await expect(userMarker).toBeAttached();

  // 4. Verify movement
  // Wait for countdown (1s) and some progress
  await page.waitForTimeout(2000);

  // Get positions
  const ghostLeft1 = await ghostMarker.evaluate(el => parseFloat(el.style.left || '0'));
  const userLeft1 = await userMarker.evaluate(el => parseFloat(el.style.left || '0'));

  console.log(`T=2s: Ghost=${ghostLeft1}%, User=${userLeft1}%`);

  // Should have started moving (Countdown 1s, Total Rep Time 3s)
  // At 2s (1s countdown + 1s rep), progress should be > 0
  expect(ghostLeft1).toBeGreaterThanOrEqual(0);
  expect(userLeft1).toBeGreaterThanOrEqual(0);

  // Wait more
  await page.waitForTimeout(2000);
  const ghostLeft2 = await ghostMarker.evaluate(el => parseFloat(el.style.left || '0'));
  const userLeft2 = await userMarker.evaluate(el => parseFloat(el.style.left || '0'));

  console.log(`T=4s: Ghost=${ghostLeft2}%, User=${userLeft2}%`);

  expect(ghostLeft2).toBeGreaterThan(ghostLeft1);
  expect(userLeft2).toBeGreaterThan(userLeft1);

  // 5. Finish
  // Wait for finish
  await expect(page.locator('#phase-display')).toHaveText('終了', { timeout: 30000 });

  // Check Toast for result
  // Look for text containing "ゴースト"
  await expect(page.locator('.achievement-toast').filter({ hasText: 'ゴースト' })).toBeVisible({ timeout: 5000 });

  // 6. Reset
  // Click reset button
  await page.click('#reset-button');
  await expect(page.locator('#session-progress-wrapper')).not.toBeVisible();
});
