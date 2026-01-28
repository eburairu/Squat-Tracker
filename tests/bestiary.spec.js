const { test, expect } = require('@playwright/test');

test.describe('Monster Bestiary', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルサーバー経由でアクセス (playwright.config.js の baseURL に依存)
    await page.goto('/');

    // アプリケーションの初期化を待つ
    await page.waitForFunction(() => window.BestiaryManager && window.BestiaryManager.isInitialized);
  });

  test('should open bestiary modal when button is clicked', async ({ page }) => {
    // 図鑑ボタンをクリック
    const button = page.locator('#bestiary-button');
    await expect(button).toBeVisible();
    await button.click();

    // モーダルが表示されることを確認
    const modal = page.locator('#bestiary-modal');
    await expect(modal).toHaveClass(/active/);
    await expect(modal).toBeVisible();
  });

  test('should display monsters correctly (first one unlocked, others locked)', async ({ page }) => {
    await page.locator('#bestiary-button').click();

    const gridItems = page.locator('.bestiary-item');
    // 10体のモンスターがいるはず
    await expect(gridItems).toHaveCount(10);

    // 1体目（スライム）は遭遇済み（unlocked）のはず
    const firstItem = gridItems.first();
    await expect(firstItem).toHaveClass(/unlocked/);
    await expect(firstItem.locator('.bestiary-name')).not.toHaveText('？？？');

    // 2体目は未遭遇（locked）のはず（初期状態）
    const secondItem = gridItems.nth(1);
    await expect(secondItem).toHaveClass(/locked/);
    await expect(secondItem.locator('.bestiary-name')).toHaveText('？？？');
  });

  test('should show details when an unlocked monster is clicked', async ({ page }) => {
    await page.locator('#bestiary-button').click();

    // 1体目をクリック
    const firstItem = page.locator('.bestiary-item').first();
    await firstItem.click();

    // 詳細ビューが表示される
    const detail = page.locator('#bestiary-detail');
    await expect(detail).toHaveClass(/active/);
    await expect(detail).toBeVisible();

    // 詳細内容の検証
    await expect(page.locator('#bestiary-detail-name')).toHaveText('スライム');
    await expect(page.locator('#bestiary-detail-title')).toHaveText('始まりのプニプニ');
    await expect(page.locator('#bestiary-detail-kills')).toContainText('討伐数: 0体'); // 戦闘中なので0
  });

  test('should verify kill count logic via state manipulation', async ({ page }) => {
    // BossBattleの状態を操作して、2周目の状態にする
    await page.evaluate(() => {
      window.BossBattle.state.loopCount = 2;
      window.BossBattle.state.monsterIndex = 0;
      window.BossBattle.saveState();
      // 再描画のためにリロードが必要だが、SPA的に状態更新だけでは反映されないため
      // BestiaryManager.render() を直接呼ぶか、一度閉じて開く
    });

    await page.locator('#bestiary-button').click();

    // 全てアンロックされているはず
    const gridItems = page.locator('.bestiary-item');
    await expect(gridItems.nth(9)).toHaveClass(/unlocked/); // ドラゴンもアンロック

    // スライムをクリック（2周目なので討伐数1のはず）
    await gridItems.first().click();
    await expect(page.locator('#bestiary-detail-kills')).toContainText('討伐数: 1体');
  });
});
