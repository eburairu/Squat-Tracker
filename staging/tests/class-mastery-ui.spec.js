import { test, expect } from '@playwright/test';

test.describe('Class Mastery UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear storage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for app init
    await page.waitForSelector('#open-class-settings');
  });

  test('should display skill tree tab', async ({ page }) => {
    // Open modal
    await page.click('#open-class-settings');

    // Check tabs
    const tab = page.locator('.modal-tab-btn[data-target="skill-tree"]');
    await expect(tab).toBeVisible();

    // Switch tab
    await tab.click();
    await expect(page.locator('#skill-tree-view')).toBeVisible();
    await expect(page.locator('#skill-tree-grid')).toBeVisible();

    // Initial SP should be 0 (Lv1)
    await expect(page.locator('#current-sp-value')).toHaveText('0');
  });

  test('should unlock node when SP is available', async ({ page }) => {
    // Inject Level 2 (100 EXP) -> 1 SP for 'novice' (default class)
    await page.evaluate(() => {
        const key = 'squat-tracker-class-mastery';
        const data = { 'novice': { exp: 100, unlockedNodes: [] } };
        localStorage.setItem(key, JSON.stringify(data));
    });
    await page.reload();

    // Open modal & tab
    await page.click('#open-class-settings');
    await page.click('.modal-tab-btn[data-target="skill-tree"]');

    // Verify SP
    await expect(page.locator('#current-sp-value')).toHaveText('1');

    // Click on Tier 1 node (novice_atk_1)
    // We rely on the fact that novice_atk_1 is at row 1, col 2
    const node = page.locator('.skill-node[data-id="novice_atk_1"]');
    await expect(node).toBeVisible();
    // It should be 'available' (yellow border animation in CSS, simplified check here)
    await expect(node).toHaveClass(/available/);

    await node.click();

    // Check Detail Panel
    const detail = page.locator('#skill-node-detail');
    await expect(detail).toBeVisible();
    await expect(page.locator('#node-detail-name')).toContainText('基礎訓練 I');

    // Click Unlock
    const btn = page.locator('#unlock-node-btn');
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('習得する');

    await btn.click();

    // Verify Update
    await expect(node).toHaveClass(/unlocked/);
    await expect(page.locator('#current-sp-value')).toHaveText('0');
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveText('習得済み');
  });

  test('should show locked state for expensive nodes', async ({ page }) => {
     // Level 1 (0 SP)
     await page.click('#open-class-settings');
     await page.click('.modal-tab-btn[data-target="skill-tree"]');

     const node = page.locator('.skill-node[data-id="novice_atk_1"]');
     await node.click();

     const btn = page.locator('#unlock-node-btn');
     await expect(btn).toBeDisabled();
     await expect(btn).toHaveText('SP不足');
  });
});
