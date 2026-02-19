import { test, expect } from '@playwright/test';

test.describe('Analytics UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/index.html');

    // Inject dummy history
    await page.evaluate(() => {
      const history = [];
      const today = new Date();
      // Generate 20 days of data
      for (let i = 0; i < 20; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        history.push({
          id: `test-${i}`,
          date: d.toISOString(),
          totalSets: 3,
          repsPerSet: 10,
          totalReps: 30,
          durations: { down: 2, hold: 1, up: 1, rest: 30, countdown: 5 },
          timeline: []
        });
      }
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
      // Reload to apply
      location.reload();
    });
    // Wait for reload
    await page.waitForLoadState('load');
  });

  test('should open analytics modal and display charts', async ({ page }) => {
    // Click Analytics Button
    await page.click('#open-analytics');

    // Check Modal Visibility
    const modal = page.locator('#analytics-modal');
    await expect(modal).toHaveClass(/active/);
    await expect(modal).toBeVisible();

    // Check Insight
    const insight = page.locator('.analytics-insight');
    await expect(insight).toBeVisible();
    await expect(insight.locator('.insight-message')).not.toBeEmpty();

    // Check Charts
    const charts = page.locator('.chart-svg');
    await expect(charts).toHaveCount(3);

    // Check Chart Content (Basic check)
    const barChart = page.locator('#chart-weekly .chart-svg');
    await expect(barChart).toBeVisible();
    await expect(barChart.locator('rect')).not.toHaveCount(0);
  });

  test('should close analytics modal', async ({ page }) => {
    await page.click('#open-analytics');
    const modal = page.locator('#analytics-modal');
    await expect(modal).toHaveClass(/active/);

    // Click Close Button
    await page.click('#analytics-modal .close-modal');
    await expect(modal).not.toHaveClass(/active/);
  });

});
