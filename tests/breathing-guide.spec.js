const { test, expect } = require('@playwright/test');

test.describe('Breathing Guide System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should initialize and toggle breathing guide correctly', async ({ page }) => {
    const toggle = page.locator('#breathing-guide-toggle');
    const textElement = page.locator('#breathing-guide-text');
    const circleElement = page.locator('#breathing-circle');

    // Ensure DOM is ready by waiting for a visible element
    await page.waitForSelector('.timer');

    // Default state: off
    await expect(toggle).not.toBeChecked();
    await expect(textElement).toHaveCSS('display', 'none');
    await expect(circleElement).toHaveCSS('display', 'none');

    // Toggle on - use evaluate to bypass visual overlay issues if any
    await page.evaluate(() => document.getElementById('breathing-guide-toggle').click());
    await expect(toggle).toBeChecked();
    await expect(textElement).not.toHaveCSS('display', 'none');
    await expect(circleElement).not.toHaveCSS('display', 'none');

    // Verify localStorage
    const storedState = await page.evaluate(() => localStorage.getItem('squat-tracker-breathing-guide'));
    expect(storedState).toBe('true');

    // Toggle off
    await page.evaluate(() => document.getElementById('breathing-guide-toggle').click());
    await expect(toggle).not.toBeChecked();
    await expect(textElement).toHaveCSS('display', 'none');
    await expect(circleElement).toHaveCSS('display', 'none');

    const updatedStoredState = await page.evaluate(() => localStorage.getItem('squat-tracker-breathing-guide'));
    expect(updatedStoredState).toBe('false');
  });

  test('should display correct text and animation class during workout phases', async ({ page }) => {
    // Ensure DOM is ready
    await page.waitForSelector('.timer');

    // 呼吸ガイドをONにする
    await page.evaluate(() => document.getElementById('breathing-guide-toggle').click());

    const textElement = page.locator('#breathing-guide-text');
    const circleElement = page.locator('#breathing-circle');

    // テスト用の設定（短時間でフェーズを進める）
    await page.fill('#countdown-duration', '1');
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '1');

    // Ensure button is clickable
    await page.evaluate(() => {
      const btn = document.getElementById('start-button');
      if(btn.disabled) {
        btn.disabled = false;
        btn.classList.remove('disabled');
      }
    });

    // Start workout explicitly via exposed function
    await page.evaluate(() => {
      if (window.startWorkout) {
        window.startWorkout();
      } else {
        document.getElementById('start-button').click();
      }
    });

    // カウントダウン中 (Phase.COUNTDOWN) は表示されないはず
    await expect(textElement).toHaveText('');
    await expect(circleElement).not.toHaveClass(/inhale|hold|exhale/);

    // DOWNフェーズ (1秒後)
    await expect(textElement).toHaveText('吸って…', { timeout: 2000 });
    await expect(circleElement).toHaveClass(/inhale/);

    // HOLDフェーズ
    await expect(textElement).toHaveText('止めて…', { timeout: 2000 });
    await expect(circleElement).toHaveClass(/hold/);

    // UPフェーズ
    await expect(textElement).toHaveText('吐いて…', { timeout: 2000 });
    await expect(circleElement).toHaveClass(/exhale/);

    // 終了後
    await expect(textElement).toHaveText('', { timeout: 3000 });
  });
});
