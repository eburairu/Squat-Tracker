const { test, expect } = require('@playwright/test');

test.describe('Title System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and reset state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('should display default title initially', async ({ page }) => {
    const titleEl = page.locator('#user-title-display');
    await expect(titleEl).toHaveText('Squat Tracker');
  });

  test('should unlock title via achievement', async ({ page }) => {
    // Simulate completing a workout to trigger "baby-steps" achievement
    // baby-steps: Total Workouts >= 1 -> rewards: p_beginner, s_trainee

    // Inject history
    await page.evaluate(() => {
        const mockHistory = [{
            id: 'test-1',
            date: new Date().toISOString(),
            totalSets: 1,
            repsPerSet: 10,
            totalReps: 10
        }];
        localStorage.setItem('squat-tracker-history-v1', JSON.stringify(mockHistory));

        // Manually trigger achievement check since we are bypassing actual workout execution
        window.AchievementSystem.check({
            historyEntries: mockHistory,
            type: 'finish'
        });
    });

    // Check localStorage for unlocked titles
    const titlesState = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('squat-tracker-titles'));
    });

    expect(titlesState.unlockedPrefixes).toContain('p_beginner');
    expect(titlesState.unlockedSuffixes).toContain('s_trainee');
  });

  test('should change title via UI', async ({ page }) => {
    // 1. Pre-unlock titles via localStorage
    await page.evaluate(() => {
        localStorage.setItem('squat-tracker-titles', JSON.stringify({
            unlockedPrefixes: ['p_beginner'],
            unlockedSuffixes: ['s_trainee'],
            currentPrefix: null,
            currentSuffix: null
        }));
    });
    await page.reload();

    // 2. Open Title Settings Modal
    // Ensure the button is visible (it's in the achievements tab)
    // Switch to achievements tab first if needed, but the button is in the tab content.
    // The tab content might be hidden until tab is clicked.
    // Check style of #tab-achievements. Class 'active' makes it visible.
    // Default active tab is 'history'.

    await page.click('button[data-tab="achievements"]');
    await expect(page.locator('#tab-achievements')).toHaveClass(/active/);

    const openBtn = page.locator('#open-title-settings');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    await expect(page.locator('#title-modal')).toBeVisible();

    // 3. Select Prefix and Suffix
    await page.selectOption('#prefix-select', 'p_beginner');
    await page.selectOption('#suffix-select', 's_trainee');

    // 4. Verify Preview
    const preview = page.locator('#title-preview-text');
    await expect(preview).toHaveText('駆け出しの見習い');

    // 5. Save
    await page.click('#save-title-button');

    // 6. Verify Modal Closed and Header Updated
    await expect(page.locator('#title-modal')).not.toHaveClass(/active/);
    await expect(page.locator('#title-modal')).toHaveAttribute('aria-hidden', 'true');
    const headerTitle = page.locator('#user-title-display');
    await expect(headerTitle).toHaveText('駆け出しの見習い');

    // 7. Verify Persistence on Reload
    await page.reload();
    await expect(page.locator('#user-title-display')).toHaveText('駆け出しの見習い');
  });
});
