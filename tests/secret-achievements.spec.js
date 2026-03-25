const { test, expect } = require('@playwright/test');

test.describe('Secret Achievements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Override the badges in memory explicitly, so we don't rely on network interception
    // because AchievementSystem.init may have already loaded the real ones.
    await page.evaluate(() => {
      window.AchievementSystem.badges = [
        {
          id: 'normal-badge',
          name: '通常の実績',
          emoji: '🥉',
          description: 'これは普通に見えます',
          condition: { type: 'TOTAL_REPS', value: 10 }
        },
        {
          id: 'secret-badge',
          name: '秘密の実績',
          emoji: '👻',
          description: '条件は秘密です',
          condition: { type: 'EVENT', name: 'secret_trigger' },
          secret: true
        }
      ];
      window.AchievementSystem.unlocked = {};
      window.AchievementSystem.render();
    });
  });

  test('should display masked values for locked secret achievements', async ({ page }) => {
    // Open past achievements tab (Wait for JS to attach listeners first)
    await page.waitForTimeout(500); // Give rendering a moment
    await page.evaluate(() => {
      const tab = document.querySelector('button[data-tab="achievements"]');
      if(tab) tab.click();
    });

    // Check normal badge exists
    const normalBadge = page.locator('.badge', { hasText: '通常の実績' });
    await expect(normalBadge).toBeVisible();

    // The mock data injects a "秘密の実績" that is secret, but it renders as "???"
    const secretBadgeMasked = page.locator('.badge', { hasText: '???' });
    await expect(secretBadgeMasked).toBeVisible();

    // Wait for event handler attachment
    await page.waitForTimeout(500);

    // Setup an alert handler to intercept window.alert
    const dialogPromise = page.waitForEvent('dialog');

    // Wait for the click evaluation to complete and the dialog event to fire
    page.evaluate(() => {
        const badge = Array.from(document.querySelectorAll('.badge')).find(el => el.textContent.includes('???'));
        if (badge) badge.click();
    });

    const dialog = await dialogPromise;
    const message = dialog.message();

    // Verify alert message hides actual name and description
    expect(message).toContain('❓ ???');
    expect(message).toContain('条件は秘密です');
    expect(message).not.toContain('秘密の実績');
    expect(message).not.toContain('👻');

    await dialog.dismiss();
  });

  test('should reveal values after unlocking a secret achievement', async ({ page }) => {
    // Open past achievements tab
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const tab = document.querySelector('button[data-tab="achievements"]');
      if(tab) tab.click();
    });

    // Make sure it exists first
    const secretBadgeMasked = page.locator('.badge', { hasText: '???' });
    await expect(secretBadgeMasked).toBeVisible();

    // Trigger unlock
    await page.evaluate(() => {
      window.AchievementSystem.check({ type: 'event', eventName: 'secret_trigger' });
    });

    // Now it should be revealed
    const secretBadgeRevealed = page.locator('.badge', { hasText: '秘密の実績' });
    await expect(secretBadgeRevealed).toBeVisible();
    await expect(secretBadgeMasked).not.toBeVisible();

    // Wait for event handler attachment
    await page.waitForTimeout(500);

    // Setup an alert handler
    const dialogPromise = page.waitForEvent('dialog');

    // Wait for the click evaluation to complete and the dialog event to fire
    page.evaluate(() => {
        const badge = Array.from(document.querySelectorAll('.badge')).find(el => el.textContent.includes('秘密の実績'));
        if (badge) badge.click();
    });

    const dialog = await dialogPromise;
    const message = dialog.message();

    // Verify alert message shows actual name and description
    expect(message).toContain('👻 秘密の実績');
    expect(message).toContain('条件は秘密です'); // In the test data, the original description is also "条件は秘密です"

    await dialog.dismiss();
  });
});
