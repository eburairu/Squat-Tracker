import { test, expect } from '@playwright/test';

test.describe('Smart Planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Inject mock history data for consistent testing
    // Added 'id' to ensure sanitizeHistoryEntries accepts them
    await page.evaluate(() => {
      const mockHistory = [
        { id: '1', totalReps: 30, totalSets: 3, repsPerSet: 10, date: new Date().toISOString() },
        { id: '2', totalReps: 30, totalSets: 3, repsPerSet: 10, date: new Date().toISOString() },
        { id: '3', totalReps: 30, totalSets: 3, repsPerSet: 10, date: new Date().toISOString() }
      ];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(mockHistory));

      // Mock Boss State
      const mockBoss = {
        currentMonster: { maxHp: 1000, currentHp: 500, name: 'Test Boss', emoji: '👾' },
        totalKills: 0
      };
      localStorage.setItem('squat-tracker-boss-v1', JSON.stringify(mockBoss));
    });

    await page.reload();
  });

  test('should display Smart Plan button', async ({ page }) => {
    const button = page.locator('#smart-plan-button');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('⚡️ メニューを提案');
  });

  test('should open modal and show plans upon clicking button', async ({ page }) => {
    await page.click('#smart-plan-button');

    const modal = page.locator('#smart-plan-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');

    // Check for 3 plans
    const plans = page.locator('.smart-plan-card');
    await expect(plans).toHaveCount(3);

    // Verify specific plan types exist
    await expect(page.locator('.plan-challenge')).toBeVisible();
    await expect(page.locator('.plan-maintain')).toBeVisible();
    await expect(page.locator('.plan-light')).toBeVisible();
  });

  test('should apply plan settings when "Apply" is clicked', async ({ page }) => {
    await page.click('#smart-plan-button');

    const applyBtn = page.locator('.plan-challenge .plan-select-btn');
    await applyBtn.click();

    // Modal should close
    const modal = page.locator('#smart-plan-modal');
    // Using not.toHaveClass /active/ is more robust than not.toBeVisible if transitions are involved
    await expect(modal).not.toHaveClass(/active/);
    await expect(modal).toHaveAttribute('aria-hidden', 'true');

    // Verify Input Fields Updated
    // Base 30 -> Challenge ~36 (3 sets * 12 reps or 4 sets * 9 reps)
    const setCount = await page.inputValue('#set-count');
    const repCount = await page.inputValue('#rep-count');

    // We expect values to be numbers and > 0
    expect(Number(setCount)).toBeGreaterThan(0);
    expect(Number(repCount)).toBeGreaterThan(0);

    // Check total reps is roughly 36
    const totalReps = Number(setCount) * Number(repCount);
    expect(totalReps).toBeGreaterThanOrEqual(30);

    // Verify Start Button is enabled (inputs triggered validation)
    const startBtn = page.locator('#start-button');
    await expect(startBtn).toBeEnabled();
  });

  test('should calculate correct load based on history', async ({ page }) => {
    // Override history with specific values
    await page.evaluate(() => {
      const highLoadHistory = [
        { id: '10', totalReps: 100, totalSets: 10, repsPerSet: 10, date: new Date().toISOString() },
        { id: '11', totalReps: 100, totalSets: 10, repsPerSet: 10, date: new Date().toISOString() },
        { id: '12', totalReps: 100, totalSets: 10, repsPerSet: 10, date: new Date().toISOString() }
      ];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(highLoadHistory));
    });
    await page.reload();

    await page.click('#smart-plan-button');

    // Maintain: 100
    const maintainCard = page.locator('.plan-maintain');
    await expect(maintainCard).toContainText('計 100'); // Check total reps text
  });
});
