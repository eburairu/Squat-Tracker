const { test, expect } = require('@playwright/test');

test.describe('最強装備自動適用機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // データ初期化待ち
    await page.waitForFunction(() => window.ClassManager && window.InventoryManager && window.TitleManager);
  });

  test('最強装備ボタンを押すと、攻撃力が最大の装備に変更される', async ({ page }) => {
    // 1. テストデータの注入
    await page.evaluate(() => {
        // 武器データのモック
        const mockWeapons = {
            'weak_sword': { id: 'weak_sword', name: '木の棒', baseAtk: 10, atkPerLevel: 1, rarity: 1, emoji: '🪵' },
            'strong_sword': { id: 'strong_sword', name: '勇者の剣', baseAtk: 100, atkPerLevel: 10, rarity: 5, emoji: '🗡️' },
            'god_sword': { id: 'god_sword', name: '神の剣', baseAtk: 999, atkPerLevel: 100, rarity: 6, emoji: '⚡️' }
        };
        // 既存のデータを上書きするのではなくマージするか、テスト用に入れ替える
        // ここでは安全のため一時的に上書きする
        window.InventoryManager.weaponsData = mockWeapons;

        // 所持アイテムの設定（神の剣は持っていない）
        window.InventoryManager.state.items = {
            'weak_sword': { level: 1 },
            'strong_sword': { level: 1 }
        };

        // 初期装備を弱いものに設定
        window.InventoryManager.equipWeapon('weak_sword');
    });

    // 2. 初期状態の確認（弱い武器）
    const initialWeaponName = await page.evaluate(() => {
        const id = window.InventoryManager.state.equippedId;
        return window.InventoryManager.weaponsData[id].name;
    });
    expect(initialWeaponName).toBe('木の棒');

    // 3. マイセットモーダルを開く
    await page.click('#open-loadout-menu');

    // モーダルのアニメーション待ち
    await expect(page.locator('#loadout-modal')).toHaveClass(/active/);

    // 4. 最強装備ボタンを押す
    await page.click('#optimize-loadout-btn');

    // 5. Toastを確認
    const toast = page.locator('.achievement-toast').filter({ hasText: '最強装備適用' });
    await expect(toast).toBeVisible();

    // 6. 装備が変更されたか確認（勇者の剣になっているべき）
    const newWeaponName = await page.evaluate(() => {
        const id = window.InventoryManager.state.equippedId;
        return window.InventoryManager.weaponsData[id].name;
    });

    expect(newWeaponName).toBe('勇者の剣');
  });

  test('称号シナジーが考慮される', async ({ page }) => {
      // 称号データのモックと所持状態の設定
      await page.evaluate(() => {
          // シナジーのモック
          window.TitleManager.data.synergies = [
              {
                  id: 'syn_test_weak',
                  name: '弱いシナジー',
                  condition: { prefix: 'p_weak', suffix: 's_weak' },
                  effect: { type: 'stat_boost', target: 'attackMultiplier', value: 0.1 }
              },
              {
                  id: 'syn_test_strong',
                  name: '最強シナジー',
                  condition: { prefix: 'p_strong', suffix: 's_strong' },
                  effect: { type: 'stat_boost', target: 'attackMultiplier', value: 0.5 }
              }
          ];

          // 称号の所持状態（強い方のパーツを持っている）
          window.TitleManager.state.unlockedPrefixes = ['p_weak', 'p_strong'];
          window.TitleManager.state.unlockedSuffixes = ['s_weak', 's_strong'];

          // 現在の装備（弱い方）
          window.TitleManager.state.currentPrefix = 'p_weak';
          window.TitleManager.state.currentSuffix = 's_weak';
      });

      // 実行
      await page.click('#open-loadout-menu');
      await expect(page.locator('#loadout-modal')).toHaveClass(/active/);

      await page.click('#optimize-loadout-btn');

      // 検証
      const currentTitle = await page.evaluate(() => {
          return {
              p: window.TitleManager.state.currentPrefix,
              s: window.TitleManager.state.currentSuffix
          };
      });

      expect(currentTitle.p).toBe('p_strong');
      expect(currentTitle.s).toBe('s_strong');
  });
});
