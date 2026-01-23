import { test, expect } from '@playwright/test';

test.describe('Streak Shield', () => {
  test.beforeEach(async ({ page }) => {
    // クリーンな状態で開始
    await page.goto('http://localhost:8000/index.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display streak shield in inventory', async ({ page }) => {
    // 自動使用を防ぐために、昨日の履歴も注入する
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const history = [{
      id: 'prev-1',
      date: yesterday.toISOString(),
      totalReps: 10,
      totalSets: 1,
      repsPerSet: 10,
      durations: {}
    }];

    await page.evaluate(({ history }) => {
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
      const state = {
        equippedId: 'unarmed',
        items: { unarmed: { level: 1 } },
        consumables: { streak_shield: 3 }
      };
      localStorage.setItem('squat-tracker-inventory', JSON.stringify(state));
    }, { history });

    // 注入した状態を反映するためにリロード
    await page.reload();

    // インベントリを開く
    await page.click('#equipment-button');

    // シールドアイテムの確認
    const shieldItem = page.locator('.consumable-item').filter({ hasText: 'ストリーク・シールド' });
    await expect(shieldItem).toBeVisible();
    await expect(shieldItem).toContainText('x3');
  });

  test('should automatically consume shield and preserve streak when yesterday is missed', async ({ page }) => {
    // 日付の設定
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const history = [{
      id: 'old-1',
      date: twoDaysAgo.toISOString(),
      totalReps: 10,
      totalSets: 1,
      repsPerSet: 10,
      durations: {}
    }];

    // 履歴とシールドの注入
    await page.evaluate(({ history }) => {
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
      const inv = {
        equippedId: 'unarmed',
        items: { unarmed: { level: 1 } },
        consumables: { streak_shield: 1 }
      };
      localStorage.setItem('squat-tracker-inventory', JSON.stringify(inv));
    }, { history });

    await page.reload();

    // トースト通知の確認 (自動使用通知)
    // 厳密なセレクタを使用して、他のトーストと混同しないようにする
    const toast = page.locator('.achievement-toast').filter({ hasText: 'ストリーク・シールド発動' });
    await expect(toast).toBeVisible({ timeout: 5000 });

    // シールドが消費されたか確認
    await page.click('#equipment-button');
    const shieldItem = page.locator('.consumable-item').filter({ hasText: 'ストリーク・シールド' });
    // InventoryManager は数が0以下のアイテムを非表示にする
    await expect(shieldItem).not.toBeVisible();

    // StreakManager の履歴が更新されたか確認
    const streakHistory = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('squat-tracker-streak-shield') || '[]');
    });
    expect(streakHistory).toHaveLength(1); // 昨日分が追加されていること
  });

  test('should not consume shield if workout was done yesterday', async ({ page }) => {
    // 日付の設定
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const history = [{
      id: 'yesterday-1',
      date: yesterday.toISOString(),
      totalReps: 10,
      totalSets: 1,
      repsPerSet: 10,
      durations: {}
    }];

    // 履歴とシールドの注入
    await page.evaluate(({ history }) => {
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
      const inv = {
        equippedId: 'unarmed',
        items: { unarmed: { level: 1 } },
        consumables: { streak_shield: 1 }
      };
      localStorage.setItem('squat-tracker-inventory', JSON.stringify(inv));
    }, { history });

    await page.reload();

    // ストリークシールドのトーストが表示されないことを確認
    const toast = page.locator('.achievement-toast').filter({ hasText: 'ストリーク・シールド発動' });
    await expect(toast).not.toBeVisible({ timeout: 2000 });

    // シールドが消費されていないことを確認
    await page.click('#equipment-button');
    const shieldItem = page.locator('.consumable-item').filter({ hasText: 'ストリーク・シールド' });
    await expect(shieldItem).toBeVisible();
    await expect(shieldItem).toContainText('x1');
  });
});
