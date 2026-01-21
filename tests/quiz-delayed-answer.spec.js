import { test, expect } from '@playwright/test';

test.describe('Quiz Delayed Answer & 1x4 Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#boss-name:not(:text("Loading..."))');

    // Setup short workout for testing
    for (const [selector, value] of [
      ['#set-count', '1'],
      ['#rep-count', '2'],
      ['#down-duration', '2'], // Need enough time to click
      ['#hold-duration', '1'],
      ['#up-duration', '2'],
      ['#rest-duration', '10'],
      ['#countdown-duration', '3']
    ]) {
      await page.locator(selector).fill(value);
      await page.locator(selector).dispatchEvent('input');
    }
  });

  test('should allow selecting an answer without immediate grading', async ({ page }) => {
    // Start workout
    await page.click('#start-button');

    // Wait for phase display to be "しゃがむ" (Phase.DOWN)
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ', { timeout: 15000 });

    // Get an option button
    const firstOption = page.locator('.quiz-option').first();
    const secondOption = page.locator('.quiz-option').nth(1);

    // Click first option
    await firstOption.click();

    // Verify it is selected but NOT correct/incorrect yet
    // Note: Since we haven't implemented the class 'selected' yet, this test is expected to fail.
    await expect(firstOption).toHaveClass(/selected/);
    await expect(firstOption).not.toHaveClass(/correct/);
    await expect(firstOption).not.toHaveClass(/incorrect/);

    // Click second option (change answer)
    await secondOption.click();

    // Verify first is deselected, second is selected
    await expect(firstOption).not.toHaveClass(/selected/);
    await expect(secondOption).toHaveClass(/selected/);
    await expect(secondOption).not.toHaveClass(/correct/);

    // Wait for Phase.UP (Answer Reveal)
    // Down (2s) -> Hold (1s) -> Up. So wait for "立つ" (Phase.UP)
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 10000 });

    // Now verification should happen.
    // The buttons should be disabled and graded.
    await expect(secondOption).toHaveClass(/(correct|incorrect)/);
  });

  test('should treat no selection as incorrect', async ({ page }) => {
    await page.click('#start-button');
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ', { timeout: 15000 });

    // Do nothing (don't click any option)

    // Wait for Phase.UP
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 10000 });

    // Verify feedback. Correct answer should be shown.
    const correctBtn = page.locator('.quiz-option.correct');
    await expect(correctBtn).toBeVisible();

    // Check for "Incorrect" toast logic (assuming app shows toast for incorrect)
    const toast = page.locator('.achievement-toast');
    await expect(toast).toContainText(/不正解|残念/);
  });

  test('should maintain 1x4 layout', async ({ page }) => {
     // Check CSS grid columns
     const container = page.locator('#quiz-options-container');
     // Playwright checks computed style. repeat(4, 1fr) usually computes to pixel values,
     // but we can check the style attribute if set inline, or verify logic.
     // Better yet, check that the container has class or style that enforces it.
     // Or just check that there are 4 buttons visible side-by-side?
     // Checking CSS property value is safer.
     // Note: `repeat(4, 1fr)` might compute to something like "100px 100px 100px 100px".
     // But let's check if we can verify the rule exists.

     // Actually, just checking if the container exists and has 4 children is basic.
     // Let's rely on the requirement "always 1x4".
     // We can check if the computed style has 4 columns.

     // This part is tricky to assert robustly across browsers without being flaky on pixels.
     // I will trust visual inspection or simple class check if I add a class.
     // For now, I'll skip complex CSS assertion and focus on the logic test above.
     // But I'll include a basic check.
     const cols = await container.evaluate((el) => {
         return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
     });
     expect(cols).toBe(4);
  });
});
