const { test, expect } = require('@playwright/test');

test.describe('Daily Fortune System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4173/');
    // Reset storage to ensure fresh state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display fortune card in stat grid', async ({ page }) => {
    const card = page.locator('#fortune-status-card');
    await expect(card).toBeVisible();
    await expect(card.locator('#fortune-text')).toHaveText('運試し');
  });

  test('should allow drawing a fortune', async ({ page }) => {
    // Open Modal
    await page.click('#fortune-status-card');
    const modal = page.locator('#fortune-modal');
    await expect(modal).toHaveClass(/active/);

    // Click Draw Button
    const drawBtn = page.locator('#fortune-draw-button');
    await expect(drawBtn).toBeVisible();
    await drawBtn.click();

    // Wait for animation (1s in code)
    await page.waitForTimeout(1100);

    // Verify Result Display
    const resultName = page.locator('#fortune-modal .fortune-result-name');
    await expect(resultName).toBeVisible({ timeout: 5000 });

    // Verify Header Update
    const closeBtn = page.locator('#fortune-modal [aria-label="閉じる"]');
    await closeBtn.click();

    const headerText = page.locator('#fortune-text');
    await expect(headerText).not.toHaveText('運試し');
  });

  test('should persist result and apply effects', async ({ page }) => {
    // Force a specific result for testing logic via evaluate if possible,
    // or just draw and check storage.
    // Let's draw normally first.
    await page.click('#fortune-status-card');
    await page.click('#fortune-draw-button');

    // Wait for result to appear (implies save happened)
    await expect(page.locator('#fortune-modal .fortune-result-name')).toBeVisible({ timeout: 5000 });

    // Check LocalStorage
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('squat-tracker-fortune');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored).toBeTruthy();
    expect(stored.lastDrawDate).toBeTruthy();
    expect(stored.result).toBeTruthy();

    // Check Multiplier Access
    const attackMultiplier = await page.evaluate(() => {
      return window.FortuneManager.getMultiplier('attack');
    });
    expect(attackMultiplier).toBeGreaterThanOrEqual(1.0);
  });

  test('should reset on new day', async ({ page }) => {
    // 1. Setup: Set a stored fortune from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0]; // Simple YYYY-MM-DD

    const fakeState = {
      lastDrawDate: yStr, // format depends on getLocalDateKey implementation
      result: {
        id: 'excellent',
        name: '大吉',
        effect: { attack: 1.5 }
      }
    };

    // Need to match the date format used by utils.getLocalDateKey
    // Assuming YYYY-MM-DD based on utils.js reading
    // Let's inject precise format
    await page.evaluate((state) => {
        // Mock getLocalDateKey format just in case
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        state.lastDrawDate = `${y}-${m}-${day}`;
        localStorage.setItem('squat-tracker-fortune', JSON.stringify(state));
    }, fakeState);

    // 2. Reload page (simulating next day app open)
    await page.reload();

    // 3. Verify Reset
    const cardText = page.locator('#fortune-text');
    await expect(cardText).toHaveText('運試し');

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('squat-tracker-fortune');
      // Note: FortuneManager currently only clears memory on checkReset,
      // but doesn't necessarily delete storage until next draw.
      // However, it should NOT return the old result.
      return window.FortuneManager.state.result;
    });
    expect(stored).toBeNull();
  });
});
