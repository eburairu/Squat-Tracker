const { test, expect } = require('@playwright/test');

test.describe('Equipment System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // LocalStorageをクリアして初期状態にする
    await page.evaluate(() => {
      localStorage.clear();
      location.reload();
    });
    // BossBattle, InventoryManagerの初期化を待つ
    await page.waitForTimeout(1000);
  });

  test('初期状態では素手のみを所持し装備している', async ({ page }) => {
    const equipBtn = page.locator('#equipment-button');
    await expect(equipBtn).toBeVisible();

    await equipBtn.click();
    const modal = page.locator('#equipment-modal');
    await expect(modal).toBeVisible();

    const listItems = page.locator('.weapon-item');
    await expect(listItems).toHaveCount(1);

    const firstItem = listItems.first();
    await expect(firstItem).toContainText('素手');
    await expect(firstItem).toHaveClass(/equipped/);

    const bonus = page.locator('#equipment-total-bonus');
    await expect(bonus).toHaveText('+0');
  });

  test('新しい武器を入手して装備できる', async ({ page }) => {
    // 武器を強制的に入手
    await page.evaluate(() => {
      InventoryManager.addWeapon('wood_sword');
    });

    const equipBtn = page.locator('#equipment-button');
    await equipBtn.click();

    const listItems = page.locator('.weapon-item');
    await expect(listItems).toHaveCount(2);

    // ひのきの棒があるか確認
    const woodSword = listItems.locator('text=ひのきの棒').first();
    const woodSwordRow = page.locator('.weapon-item').filter({ hasText: 'ひのきの棒' });
    await expect(woodSwordRow).toBeVisible();

    // クリックして装備
    await woodSwordRow.click();
    await expect(woodSwordRow).toHaveClass(/equipped/);

    // ボーナス確認 (ひのきの棒 Lv1 は +2)
    const bonus = page.locator('#equipment-total-bonus');
    await expect(bonus).toHaveText('+2');
  });

  test('重複入手でレベルアップする', async ({ page }) => {
    // 武器を2回入手
    await page.evaluate(() => {
      InventoryManager.addWeapon('wood_sword');
      InventoryManager.addWeapon('wood_sword');
    });

    const equipBtn = page.locator('#equipment-button');
    await equipBtn.click();

    const woodSwordRow = page.locator('.weapon-item').filter({ hasText: 'ひのきの棒' });

    // Lv.2 になっているか
    await expect(woodSwordRow).toContainText('Lv.2');

    // 装備してボーナス確認 (Lv2 = Base 2 + (2-1)*1 = 3)
    await woodSwordRow.click();
    const bonus = page.locator('#equipment-total-bonus');
    await expect(bonus).toHaveText('+3');
  });

  test('永続化されている', async ({ page }) => {
    // 装備変更
    await page.evaluate(() => {
      InventoryManager.addWeapon('wood_sword');
      InventoryManager.equipWeapon('wood_sword');
    });

    // リロード
    await page.reload();
    await page.waitForTimeout(1000);

    const equipBtn = page.locator('#equipment-button');
    await equipBtn.click();

    const bonus = page.locator('#equipment-total-bonus');
    await expect(bonus).toHaveText('+2'); // wood_sword Lv1 bonus

    const woodSwordRow = page.locator('.weapon-item').filter({ hasText: 'ひのきの棒' });
    await expect(woodSwordRow).toHaveClass(/equipped/);
  });
});
