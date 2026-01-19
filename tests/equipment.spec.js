const { test, expect } = require('@playwright/test');

test.describe('Equipment System (Rarity Update)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      location.reload();
    });
    await page.waitForTimeout(1000);
  });

  test('初期状態では素手のみを所持し装備している', async ({ page }) => {
    const equipBtn = page.locator('#equipment-button');
    await equipBtn.click();

    const listItems = page.locator('.weapon-item');
    await expect(listItems).toHaveCount(1);
    await expect(listItems.first()).toContainText('素手');
  });

  test('レアリティの異なる同名武器は別アイテムとして扱われる', async ({ page }) => {
    // 同じ基本武器の異なるレアリティを入手
    await page.evaluate(() => {
      InventoryManager.addWeapon('wood_sword_r1'); // Common
      InventoryManager.addWeapon('wood_sword_r5'); // Legendary
    });

    const equipBtn = page.locator('#equipment-button');
    await equipBtn.click();

    const listItems = page.locator('.weapon-item');
    // 素手 + r1 + r5 = 3つ
    await expect(listItems).toHaveCount(3);

    // 素手(★1)も含まれるので、"ひのきの棒" で絞り込んでからレアリティ確認
    const woodSwordR1 = listItems.filter({ hasText: 'ひのきの棒' }).filter({ hasText: '★' }).filter({ hasNotText: '★★' }); // ★1
    const woodSwordR5 = listItems.filter({ hasText: 'ひのきの棒' }).filter({ hasText: '★★★★★' }); // ★5

    await expect(woodSwordR1).toBeVisible();
    await expect(woodSwordR5).toBeVisible();

    // 攻撃力の違いを確認 (Base2 * 1.0 vs Base2 * 6.0 = 12)
    // r1 should be +2, r5 should be +12
    await expect(woodSwordR1).toContainText('+2');
    await expect(woodSwordR5).toContainText('+12');
  });

  test('同じレアリティの武器入手でレベルアップする', async ({ page }) => {
    await page.evaluate(() => {
      InventoryManager.addWeapon('wood_sword_r2');
      InventoryManager.addWeapon('wood_sword_r2');
    });

    const equipBtn = page.locator('#equipment-button');
    await equipBtn.click();

    const item = page.locator('.weapon-item').filter({ hasText: 'ひのきの棒' }).filter({ hasText: '★★' });
    await expect(item).toContainText('Lv.2');
  });

  test('マイグレーション機能が動作する', async ({ page }) => {
    // 古いデータ形式を注入
    await page.evaluate(() => {
      const oldState = {
        equippedId: 'wood_sword',
        items: {
          'unarmed': { level: 1 },
          'wood_sword': { level: 5 }
        }
      };
      localStorage.setItem('squat-tracker-inventory', JSON.stringify(oldState));
      location.reload();
    });

    await page.waitForTimeout(1000); // Wait for init and migration

    const equipBtn = page.locator('#equipment-button');
    await equipBtn.click();

    // wood_sword -> wood_sword_r1 に変換されているはず
    const item = page.locator('.weapon-item').filter({ hasText: 'ひのきの棒' });
    await expect(item).toContainText('Lv.5');
    await expect(item).toContainText('★'); // Rarity 1
    await expect(item).toHaveClass(/equipped/); // Still equipped
  });
});
