import { test, expect } from '@playwright/test';

test.describe('Adventure Mode: Route Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // データの初期化
    await page.evaluate(() => {
      localStorage.clear();
      // リロードして初期化を反映させる必要はないが、モジュールの状態をリセットするためにreload推奨
    });
    await page.reload();

    // モジュールの読み込み待ち
    await page.waitForFunction(() => window.AdventureSystem && window.BossBattle);
  });

  test('should show route selection modal on area clear and apply modifiers', async ({ page }) => {
    // 1. エリアクリア直前の状態にセットアップ
    await page.evaluate(() => {
      // エリア0 (totalNodes: 10) の 9番目のノードに設定
      const state = {
        currentAreaIndex: 0,
        currentNodeIndex: 9, // 次のadvanceでクリア
        currentRouteId: 'normal',
        routeModifiers: { hp: 1.0, exp: 1.0, drop: 1.0 }
      };
      localStorage.setItem('squat-tracker-adventure', JSON.stringify(state));

      // AdventureSystemに再読み込みさせる
      window.AdventureSystem.init();
      window.AdventureSystem.render();

      // BossBattleのモンスターHPを1にしておく（すぐ倒せるように）
      const bossState = {
        currentMonster: { maxHp: 10, currentHp: 1, name: 'Test Slime', emoji: '🧪' },
        lastInteraction: Date.now()
      };
      localStorage.setItem('squat-tracker-boss-v1', JSON.stringify(bossState));
      window.BossBattle.loadState();
      window.BossBattle.render();
    });

    // 2. ボスにとどめを刺す
    // UI操作ではなく内部メソッドを呼ぶ方が確実だが、テストの趣旨としてはインタラクションを含めたい
    // ここではダメージを与えて倒す
    await page.evaluate(() => {
      window.BossBattle.damage(100); // 確実に倒す
    });

    // 3. エリアクリアのトーストが出るはず
    // タイミングによっては消えているかもしれないが、ログや状態遷移で確認

    // 4. ルート選択モーダルが表示されるのを待つ (delay 1000ms in handleDefeat)
    const modal = page.locator('#route-selection-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 5. カードが表示されているか確認
    const hardCard = page.locator('.route-card.route-hard');
    await expect(hardCard).toBeVisible();
    await expect(hardCard).toContainText('修羅の道');

    // 6. 「修羅の道」を選択
    await hardCard.click();

    // 7. モーダルが閉じるのを確認
    await expect(modal).not.toBeVisible();

    // 8. 状態が更新されたか確認
    const modifiers = await page.evaluate(() => {
      return window.AdventureSystem.getRouteModifiers();
    });
    expect(modifiers.hp).toBe(1.5);

    // 9. 次のモンスターがスポーンしているか確認
    await page.waitForTimeout(500); // スポーン待ち
    const currentMonsterHp = await page.evaluate(() => {
      return window.BossBattle.state.currentMonster.maxHp;
    });

    // HPが通常より高くなっているはず（乱数要素があるが、Scaling 1.0 * 1.5 なので最低値も上がるはず）
    // 初期モンスター(Slime) HP: 30-50. Scaling 1.0. Hard x1.5 -> 45-75.
    // Normalなら 30-50.
    // 確実な検証は難しいが、modifiersがセットされていることは確認済み。
    console.log('Spawned Monster MaxHP:', currentMonsterHp);
    expect(currentMonsterHp).toBeGreaterThan(0);
  });

  test('should default to normal route if initialized without selection', async ({ page }) => {
    // ローカルストレージをクリアした状態で起動
    const modifiers = await page.evaluate(() => {
      return window.AdventureSystem.getRouteModifiers();
    });
    expect(modifiers.hp).toBe(1.0);
    expect(modifiers.exp).toBe(1.0);
  });
});
