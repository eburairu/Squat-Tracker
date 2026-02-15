import { test, expect } from '@playwright/test';

test.describe('Smart Planner Verification', () => {
  test('should verify UI and take screenshot', async ({ page }) => {
    await page.goto('/');

    // Inject mock history
    await page.evaluate(() => {
      const mockHistory = [
        { id: '1', totalReps: 30, totalSets: 3, repsPerSet: 10, date: new Date().toISOString() },
        { id: '2', totalReps: 30, totalSets: 3, repsPerSet: 10, date: new Date().toISOString() },
        { id: '3', totalReps: 30, totalSets: 3, repsPerSet: 10, date: new Date().toISOString() }
      ];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(mockHistory));
    });
    await page.reload();

    // 1. Initial State (Button visible)
    const button = page.locator('#smart-plan-button');
    await expect(button).toBeVisible();

    // 2. Open Modal
    await button.click();
    const modal = page.locator('#smart-plan-modal');
    await expect(modal).toBeVisible();
    // Wait for animation if needed, though expect.toBeVisible handles it mostly
    await page.waitForTimeout(500);

    await expect(page.locator('.plan-challenge')).toBeVisible();

    // 3. Take Screenshot
    await page.screenshot({ path: 'verification/smart-planner-modal.png', fullPage: false });
  });
});
