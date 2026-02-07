import { test, expect } from '@playwright/test';

test.describe('Streak Guardian', () => {
  test.beforeEach(async ({ page }) => {
    // 時計を固定 (2024-01-01 12:00:00 UTC)
    // ローカルタイム依存のロジックがある場合、タイムゾーンの影響を受ける可能性があるが、
    // Dateオブジェクト同士の差分計算なので相対時間は合うはず。
    await page.clock.install({ time: new Date('2024-01-01T12:00:00Z') });
    await page.goto('/');

    // 依存スクリプトのロード待ち（念のため）
    await page.waitForFunction(() => window.StreakGuardian);
  });

  test('should be hidden when no history', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    // 画面遷移後、少し待つ
    await page.waitForFunction(() => document.readyState === 'complete');

    const guardian = page.locator('#streak-guardian');
    await expect(guardian).not.toBeVisible();
  });

  test('should show completed status if worked out today', async ({ page }) => {
    // Inject history for today (2024-01-01)
    await page.evaluate(() => {
      const history = [{
        id: '1',
        date: new Date('2024-01-01T10:00:00Z').toISOString(),
        totalReps: 30,
        totalSets: 3,
        repsPerSet: 10
      }];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
    });
    await page.reload();
    await page.waitForFunction(() => window.StreakGuardian);

    const guardian = page.locator('#streak-guardian');
    await expect(guardian).toBeVisible();
    await expect(guardian).toHaveClass(/status-completed/);
    await expect(guardian).toContainText('本日のトレーニング完了！');
  });

  test('should show safe status', async ({ page }) => {
    // Inject history for yesterday (2023-12-31)
    // Deadline: 2024-01-01 23:59:59 (Local Time of browser context)
    // タイムゾーンの扱いに注意が必要。
    // PlaywrightのclockはデフォルトでUTC?
    // ブラウザのローカルタイムゾーン設定に依存する。
    // 安全のため、差分だけを見るロジックにするか、localStorageに入れる日付を調整する。

    // 昨日の日付を入れる
    const yesterday = new Date('2023-12-31T12:00:00Z');

    await page.evaluate((dateStr) => {
      const history = [{
        id: '1',
        date: dateStr,
        totalReps: 30,
        totalSets: 3,
        repsPerSet: 10
      }];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
    }, yesterday.toISOString());

    await page.reload();
    await page.waitForFunction(() => window.StreakGuardian);

    const guardian = page.locator('#streak-guardian');
    await expect(guardian).toBeVisible();
    await expect(guardian).toHaveClass(/status-safe/);
    await expect(guardian).toContainText('連続記録継続中');
  });

  test('should show warning status', async ({ page }) => {
    // Advance time to 19:00 (remaining 5h < 6h) relative to "Today"
    // 今日の23:59:59が期限。
    // 現在時刻を 2024-01-01T19:00:00Z に設定。
    await page.clock.setSystemTime(new Date('2024-01-01T19:00:00Z'));

    const yesterday = new Date('2023-12-31T12:00:00Z');

    await page.evaluate((dateStr) => {
      const history = [{
        id: '1',
        date: dateStr,
        totalReps: 30,
        totalSets: 3,
        repsPerSet: 10
      }];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
    }, yesterday.toISOString());

    await page.reload();
    await page.waitForFunction(() => window.StreakGuardian);

    const guardian = page.locator('#streak-guardian');
    await expect(guardian).toBeVisible();
    // Warning or Danger depending on exact timezone calculation
    // UTCでの19:00は、もしブラウザがJSTなら翌日04:00になってしまう。
    // Playwrightの設定でtimezoneIdを指定していない場合、システムロケールになる。
    // ここではテストの堅牢性のために、クラスが warning か danger のいずれかであることを確認する、
    // あるいはUTC前提でコードを書く。
    // アプリコードは `new Date()` を使っているのでローカルタイム。
    // テストコードも `new Date(...)` はローカルタイムとして解釈される（コンストラクタの文字列にZがなければ）。
    // ここではZをつけているのでUTC扱い。
    // コンテナ環境はおそらくUTC。

    await expect(guardian).toHaveClass(/status-warning/);
    await expect(guardian).toContainText('記録継続の期限まで');
  });

  test('should show danger status', async ({ page }) => {
    // Advance time to 22:00 (remaining 2h < 3h)
    await page.clock.setSystemTime(new Date('2024-01-01T22:00:00Z'));

    const yesterday = new Date('2023-12-31T12:00:00Z');

    await page.evaluate((dateStr) => {
      const history = [{
        id: '1',
        date: dateStr,
        totalReps: 30,
        totalSets: 3,
        repsPerSet: 10
      }];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
    }, yesterday.toISOString());

    await page.reload();
    await page.waitForFunction(() => window.StreakGuardian);

    const guardian = page.locator('#streak-guardian');
    await expect(guardian).toBeVisible();
    await expect(guardian).toHaveClass(/status-danger/);
    await expect(guardian).toContainText('期限まであとわずか！');
  });

  test('should show lost status', async ({ page }) => {
    // Advance time to next day (2024-01-02) -> Deadline passed
    await page.clock.setSystemTime(new Date('2024-01-02T00:00:01Z'));

    const yesterday = new Date('2023-12-31T12:00:00Z'); // 2 days ago now

    await page.evaluate((dateStr) => {
      const history = [{
        id: '1',
        date: dateStr,
        totalReps: 30,
        totalSets: 3,
        repsPerSet: 10
      }];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
    }, yesterday.toISOString());

    await page.reload();
    await page.waitForFunction(() => window.StreakGuardian);

    const guardian = page.locator('#streak-guardian');
    await expect(guardian).toBeVisible();
    await expect(guardian).toHaveClass(/status-lost/);
    await expect(guardian).toContainText('記録が途切れました');
  });

  test('should show toast details on click', async ({ page }) => {
    // Inject history for yesterday
    const yesterday = new Date('2023-12-31T12:00:00Z');
    await page.evaluate((dateStr) => {
      const history = [{
        id: '1',
        date: dateStr,
        totalReps: 30,
        totalSets: 3,
        repsPerSet: 10
      }];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
    }, yesterday.toISOString());

    await page.reload();
    await page.waitForFunction(() => window.StreakGuardian);

    const guardian = page.locator('#streak-guardian');
    await expect(guardian).toBeVisible();

    // Click
    await guardian.click();

    // Check Toast
    const toast = page.locator('.achievement-toast').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('有効期限');
    await expect(toast).toContainText('までに次のトレーニングを行ってください');
  });
});
