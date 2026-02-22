const { test, expect } = require('@playwright/test');

test.describe('Weekly Scheduler', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app initialization and SchedulerManager
    await page.waitForFunction(() => typeof window.SchedulerManager !== 'undefined');
  });

  test('should create, display, apply, and delete a schedule', async ({ page }) => {
    // 1. Open Scheduler Modal
    await page.locator('#open-scheduler-button').click();
    const modal = page.locator('#scheduler-modal');
    await expect(modal).toHaveClass(/active/);

    // 2. Create Schedule (Improve Plan, All Days)
    // Use evaluate to click hidden inputs reliably
    await page.locator('input[name="scheduler-plan"][value="improve"]').evaluate(el => el.click());

    // Select all days to guarantee today is included
    const dayCheckboxes = page.locator('input[name="scheduler-day"]');
    const count = await dayCheckboxes.count();
    for (let i = 0; i < count; i++) {
        await dayCheckboxes.nth(i).evaluate(el => {
            if (!el.checked) el.click();
        });
    }

    // Save
    await page.locator('#save-schedule-button').click();
    await expect(modal).not.toHaveClass(/active/);

    // 3. Verify Card Display
    const card = page.locator('#daily-schedule-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('体力向上');

    // 4. Apply Settings
    await page.locator('#start-schedule-button').click();
    await expect(page.locator('#rep-count')).toHaveValue('15'); // Improve plan has 15 reps

    // 5. Delete Schedule
    // First open modal again
    await page.locator('#open-scheduler-button').click();

    // Setup dialog handler
    page.once('dialog', dialog => dialog.accept());

    // Click Clear
    await page.locator('#clear-schedule-button').click();

    // Verify Modal Closed and Card Hidden
    await expect(modal).not.toHaveClass(/active/);
    await expect(card).not.toBeVisible();
  });
});
