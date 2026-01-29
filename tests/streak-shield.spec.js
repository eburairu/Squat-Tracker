const { test, expect } = require('@playwright/test');

test.describe('Streak Shield System', () => {

  test('should grant initial shield gift on first launch', async ({ page }) => {
    // 1. Load page to access localStorage context
    await page.goto('/');
    // 2. Clear storage to simulate fresh install
    await page.evaluate(() => localStorage.clear());

    // 3. Navigate again to trigger app initialization as a fresh user
    await page.goto('/');

    // 4. Wait for UI updates (this implies app has initialized)
    await expect(page.locator('#stat-shield')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#shield-count')).toHaveText('1', { timeout: 10000 });

    // 5. Check flag
    const giftFlag = await page.evaluate(() => localStorage.getItem('squat-tracker-shield-gift-v1'));
    expect(giftFlag).toBe('true');
  });

  test('should protect streak by consuming shield when a day is missed', async ({ page }) => {
    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);

    const mockHistory = [
      {
        id: 'test-entry-1',
        date: twoDaysAgo.toISOString(),
        totalSets: 1, repsPerSet: 10, totalReps: 10, durations: {}
      }
    ];

    const mockInventory = {
      equippedId: 'unarmed',
      items: { unarmed: { level: 1, acquiredAt: Date.now() } },
      consumables: { shield: 2 }
    };

    await page.goto('/');
    await page.evaluate(({ h, i }) => {
      localStorage.clear();
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(h));
      localStorage.setItem('squat-tracker-inventory', JSON.stringify(i));
      // Set gift flag to avoid adding extra shield logic
      localStorage.setItem('squat-tracker-shield-gift-v1', 'true');
    }, { h: mockHistory, i: mockInventory });

    await page.reload();

    // Verify Shield Count (Should decrease from 2 to 1)
    await expect(page.locator('#shield-count')).toHaveText('1', { timeout: 10000 });

    // Verify Toast Notification
    const toast = page.locator('.achievement-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('ストリークシールド発動');

    // Verify History
    const history = await page.evaluate(() => JSON.parse(localStorage.getItem('squat-tracker-history-v1')));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const shieldEntry = history.find(entry => entry.type === 'shield');
    expect(shieldEntry).toBeDefined();
    expect(shieldEntry.totalReps).toBe(0);

    const entryDate = new Date(shieldEntry.date);
    expect(entryDate.getDate()).toBe(yesterday.getDate());
  });

  test('should not consume shield if no days are missed', async ({ page }) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const mockHistory = [
      {
        id: 'test-entry-ok',
        date: yesterday.toISOString(),
        totalSets: 1, repsPerSet: 10, totalReps: 10, durations: {}
      }
    ];

    const mockInventory = {
        equippedId: 'unarmed',
        items: { unarmed: { level: 1, acquiredAt: Date.now() } },
        consumables: { shield: 1 }
    };

    await page.goto('/');
    await page.evaluate(({ h, i }) => {
      localStorage.clear();
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(h));
      localStorage.setItem('squat-tracker-inventory', JSON.stringify(i));
      localStorage.setItem('squat-tracker-shield-gift-v1', 'true');
    }, { h: mockHistory, i: mockInventory });

    await page.reload();

    // Shield count should remain 1
    await expect(page.locator('#shield-count')).toHaveText('1', { timeout: 10000 });

    const historyLength = await page.evaluate(() => JSON.parse(localStorage.getItem('squat-tracker-history-v1')).length);
    expect(historyLength).toBe(1);
  });
});
