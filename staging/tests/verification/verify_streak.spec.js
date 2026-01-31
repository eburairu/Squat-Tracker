import { test, expect } from '@playwright/test';

test('verify streak guardian visual', async ({ page }) => {
  await page.clock.install({ time: new Date('2024-01-01T22:00:00Z') });
  await page.goto('http://localhost:8000/');

  await page.evaluate(() => {
    const history = [{
      id: '1',
      date: new Date('2023-12-31T12:00:00Z').toISOString(),
      totalReps: 30,
      totalSets: 3,
      repsPerSet: 10
    }];
    localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
  });

  await page.reload();
  await page.waitForFunction(() => window.StreakGuardian && document.querySelector('#streak-guardian').style.display !== 'none');

  const guardian = page.locator('#streak-guardian');
  await expect(guardian).toBeVisible();

  // Wait for stability
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'verification-streak.png' });
});
