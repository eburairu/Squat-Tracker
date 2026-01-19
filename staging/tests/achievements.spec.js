const { test, expect } = require('@playwright/test');

test.describe('Achievement System', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging from browser
    page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('squat-tracker-achievements');
      localStorage.removeItem('squat-tracker-history-v1');
    });
    await page.reload();
  });

  test('should initialize AchievementSystem', async ({ page }) => {
    const isInitialized = await page.evaluate(() => {
      return !!window.AchievementSystem;
    });
    expect(isInitialized).toBe(true);
  });

  test('should have 30 badges defined', async ({ page }) => {
    const count = await page.evaluate(() => window.AchievementSystem.badges.length);
    expect(count).toBe(30);
  });

  test('should unlock "Baby Steps" badge after first workout', async ({ page }) => {
    // Mock history with one entry
    await page.evaluate(() => {
      const history = [{
        id: '1', date: new Date().toISOString(), totalReps: 10, totalSets: 1, repsPerSet: 10
      }];
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));

      // Trigger check manually passing historyEntries explicitly
      // because we cannot update the internal historyEntries variable from here
      window.AchievementSystem.check({ type: 'finish', historyEntries: history });

      console.log('Is unlocked:', window.AchievementSystem.isUnlocked('baby-steps'));
    });

    const unlocked = await page.evaluate(() => {
      return window.AchievementSystem.isUnlocked('baby-steps');
    });
    expect(unlocked).toBe(true);
  });

  test('should persist achievements to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      window.AchievementSystem.unlock('baby-steps');
    });

    // Verify localStorage directly
    const storage = await page.evaluate(() => localStorage.getItem('squat-tracker-achievements'));
    console.log('Storage content:', storage);
    expect(storage).toContain('baby-steps');

    await page.reload();

    const unlocked = await page.evaluate(() => {
      return window.AchievementSystem.isUnlocked('baby-steps');
    });
    expect(unlocked).toBe(true);
  });

  test('should verify UI visually', async ({ page }) => {
    // Inject some achievements
    await page.evaluate(() => {
      window.AchievementSystem.unlock('baby-steps');
      window.AchievementSystem.unlock('reps-100');
      window.AchievementSystem.render();
    });

    // Switch to Achievements tab
    await page.click('[data-tab="achievements"]');
    await page.waitForSelector('#tab-achievements.active');

    // Check if badges are visible
    await expect(page.locator('.badge.unlocked')).toHaveCount(2);

    // Wait for animations
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'achievements-tab.png' });
  });
});
