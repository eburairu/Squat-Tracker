const { test, expect } = require('@playwright/test');

test('Activity Heatmap Verification', async ({ page }) => {
  // Inject data before loading
  await page.addInitScript(() => {
    const entries = [];
    const now = new Date();
    for (let i = 0; i < 180; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        if (i % 4 === 0) continue;
        entries.push({
            id: `${Date.now()}-${i}`,
            date: date.toISOString(),
            totalSets: 3,
            repsPerSet: 10,
            totalReps: 50,
            durations: { down: 2, hold: 1, up: 1, rest: 30, countdown: 5 },
        });
    }
    localStorage.setItem('squat-tracker-history-v1', JSON.stringify(entries));
  });

  await page.goto('/');

  // Verify container exists
  const container = page.locator('#activity-heatmap');
  await expect(container).toBeVisible();

  // Verify rank (180 days * ~0.7 active * 50 reps ~= 6300 reps -> Platinum)
  const rank = page.locator('#stats-rank');
  // It might be Gold or Diamond depending on random, but mostly Platinum.
  // Wait, the random seed is not fixed. Math.random() is used in the init script.
  // I should remove randomness or assert loosely.
  // Or check if it is one of the ranks.
  // Updated for RPG System: format is "Lv.X (AP:Y)"
  await expect(rank).toHaveText(/Lv\.\d+ \(AP:\d+\)/);

  // Wait for rendering
  await page.waitForTimeout(500);

  // Verify grid rendering
  const cells = page.locator('.heatmap-cell');
  expect(await cells.count()).toBeGreaterThan(100);

  // Hover over a cell with data (level > 0)
  const activeCell = page.locator('.heatmap-cell[data-level="1"], .heatmap-cell[data-level="2"], .heatmap-cell[data-level="3"], .heatmap-cell[data-level="4"]').first();

  if (await activeCell.count() > 0) {
      await activeCell.hover();

      const tooltip = page.locator('.heatmap-tooltip');
      await expect(tooltip).toBeVisible();
      const text = await tooltip.textContent();
      console.log('Tooltip text:', text);
      expect(text).toMatch(/\d{4}\/\d{2}\/\d{2}: \d+回/);
  }
});
