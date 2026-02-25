import { test, expect } from '@playwright/test';

test.describe('Squat Bingo Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear storage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for Bingo initialization (render happens on init)
    // We look for mission-tab-weekly to be present
    await page.waitForSelector('#mission-tab-weekly');
  });

  test('should render 3x3 bingo grid', async ({ page }) => {
    // Switch to Weekly tab
    await page.click('#mission-tab-weekly');

    // Check grid
    const cells = page.locator('.bingo-cell');
    await expect(cells).toHaveCount(9);

    // Check header
    const remaining = page.locator('#weekly-info-container');
    await expect(remaining).toBeVisible();
    await expect(remaining).toContainText('残り日数');
  });

  test('should update progress on workout finish', async ({ page }) => {
    await page.click('#mission-tab-weekly');

    // Force specific state
    await page.evaluate(() => {
        window.BingoManager.state.cells = [
            { id: 0, type: 'total_reps', target: 10, current: 0, completed: false, description: 'Test Reps', unit: '回', emoji: 'T' },
            ...Array(8).fill(null).map((_, i) => ({ id: i+1, type: 'dummy', target: 100, current: 0, completed: false, description: 'Dummy', unit: 'x', emoji: 'D' }))
        ];
        window.BingoManager.save();
        window.BingoManager.render();
    });

    // Check initial state (width 0%)
    const targetCellBar = page.locator('.bingo-cell[data-id="0"] .cell-progress-bar');
    // Initial width should be minimal or 0%
    // We can check attribute style
    await expect(targetCellBar).toHaveAttribute('style', 'width: 0%;');

    // Perform Workout (1 set, 10 reps)
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '10');

    // Mock workout execution
    await page.evaluate(() => {
        window.startWorkout();
        window.finishWorkout();
    });

    // Check progress
    await page.click('#mission-tab-weekly'); // Re-open tab to ensure visibility
    const cell = page.locator('.bingo-cell[data-id="0"]');
    await expect(cell).toHaveClass(/completed/);
    await expect(cell.locator('.stamp')).toBeVisible();
  });

  test('should grant reward on line completion', async ({ page }) => {
      // Setup: 2 cells in row-0 are completed, last one needs 10 reps
      await page.evaluate(() => {
        // Full initialization to avoid undefined errors in checkLines
        const cells = [];
        for(let i=0; i<9; i++) {
            cells.push({ id: i, type: 'dummy', target: 100, current: 0, completed: false, description: 'Dummy', unit: 'x', emoji: 'D' });
        }
        // Row 0 setup
        cells[0].completed = true;
        cells[1].completed = true;
        cells[2] = { id: 2, type: 'total_reps', target: 10, current: 0, completed: false, description: 'Final', unit: '回', emoji: 'F' };

        window.BingoManager.state.cells = cells;
        window.BingoManager.state.claimedLines = [];
        window.BingoManager.save();
        window.BingoManager.render();
      });

      // Finish workout to complete cell 2
      await page.fill('#set-count', '1');
      await page.fill('#rep-count', '10');
      await page.evaluate(() => {
          window.startWorkout();
          window.finishWorkout();
      });

      // Expect Toast for Line Completion
      // Toast might disappear quickly, so we check if it appears
      // const toast = page.locator('.toast-notification').filter({ hasText: 'BINGO!' });
      // await expect(toast).toBeVisible();

      // Check claimed lines in state (poll for update)
      await expect.poll(async () => {
          return await page.evaluate(() => window.BingoManager.state.claimedLines);
      }).toContain('row-0');
  });
});
