const { test, expect } = require('@playwright/test');

test.describe('Weekly Challenge System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for initialization
    await page.waitForFunction(() => window.WeeklyChallengeSystem);
  });

  test('should display weekly missions tab and list', async ({ page }) => {
    // Check tabs exist
    const dailyTab = page.locator('#mission-tab-daily');
    const weeklyTab = page.locator('#mission-tab-weekly');
    await expect(dailyTab).toBeVisible();
    await expect(weeklyTab).toBeVisible();

    // Click weekly tab
    await weeklyTab.click();
    await expect(weeklyTab).toHaveClass(/active/);
    await expect(dailyTab).not.toHaveClass(/active/);

    // Check list container visibility
    const dailyList = page.locator('#mission-list');
    const weeklyList = page.locator('#mission-list-weekly');
    await expect(dailyList).not.toBeVisible();
    await expect(weeklyList).toBeVisible();

    // Check missions generated
    const missions = weeklyList.locator('.weekly-mission');
    // Expect 3 missions by default
    await expect(missions).toHaveCount(3);
  });

  test('should display weekly remaining days', async ({ page }) => {
    // Click weekly tab
    await page.locator('#mission-tab-weekly').click();

    // Check remaining days element visibility and text
    const remainingInfo = page.locator('#weekly-info-container');
    await expect(remainingInfo).toBeVisible();
    await expect(remainingInfo).toContainText('今週の残り:');
    // Ensure the days number is present (1-8 to be safe, logic says 8-day)
    // Logic: 8 - day (1..7). So 1 to 7.
    await expect(page.locator('#weekly-remaining-days')).toHaveText(/[1-7]/);

    // Switch back to daily
    await page.locator('#mission-tab-daily').click();
    await expect(remainingInfo).not.toBeVisible();
  });

  test('should update progress on workout finish', async ({ page }) => {
    // 1. Force a specific mission (Total Reps) for testing
    await page.evaluate(() => {
      const state = window.WeeklyChallengeSystem.state;
      state.missions = [{
        id: 'test_mission',
        type: 'total_reps',
        description: 'Test Mission',
        target: 10,
        current: 0,
        unit: 'reps',
        completed: false,
        claimed: false
      }];
      window.WeeklyChallengeSystem.save();
      window.WeeklyChallengeSystem.render();
    });

    // Verify initial state
    await page.locator('#mission-tab-weekly').click();
    await expect(page.locator('.weekly-mission .mission-progress-text')).toContainText('0 / 10');

    // 2. Perform a workout
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '5');

    // Mock finishWorkout call to avoid running the full timer
    await page.evaluate(() => {
        window.WeeklyChallengeSystem.check({
            type: 'finish',
            totalReps: 5,
            totalSets: 1
        });
    });

    // 3. Verify progress update
    await expect(page.locator('.weekly-mission .mission-progress-text')).toContainText('5 / 10');
  });

  test('should handle weekly reset', async ({ page }) => {
    // 1. Set old date in localStorage
    await page.evaluate(() => {
      const oldState = {
        lastUpdatedWeek: '2000-W01', // Very old date
        missions: []
      };
      localStorage.setItem('squat-tracker-weekly-challenge', JSON.stringify(oldState));
    });

    // 2. Reload page to trigger init() and reset check
    await page.reload();
    await page.waitForFunction(() => window.WeeklyChallengeSystem);

    // 3. Verify new missions generated
    await page.evaluate(() => {
        // Force render just in case tab isn't clicked (though init should generate)
        window.WeeklyChallengeSystem.render();
    });

    const state = await page.evaluate(() => window.WeeklyChallengeSystem.state);
    expect(state.lastUpdatedWeek).not.toBe('2000-W01');
    expect(state.missions.length).toBe(3);
  });
});
