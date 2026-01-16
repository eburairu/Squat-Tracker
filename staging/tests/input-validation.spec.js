const { test, expect } = require('@playwright/test');

test.describe('Input Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should validate input and prevent saving invalid values', async ({ page }) => {
    const setCountInput = page.locator('#set-count');
    const startButton = page.locator('#start-button');

    // 1. Check initial state (valid)
    await expect(setCountInput).toHaveValue('3');
    await expect(startButton).toBeEnabled();
    await expect(setCountInput).not.toHaveClass(/input-error/);

    // 2. Enter invalid value (negative)
    await setCountInput.fill('-5');
    // Trigger input event (fill does this) and change (blur)
    await setCountInput.blur();

    // EXPECTATION 1: Visual feedback
    // We expect a class 'input-error' to be added
    await expect(setCountInput).toHaveClass(/input-error/);

    // EXPECTATION 2: Start button disabled
    await expect(startButton).toBeDisabled();

    // 3. Reload to check persistence
    await page.reload();

    // EXPECTATION 3: Invalid value should NOT be saved
    // It should revert to default (3) or the last valid value.
    await expect(setCountInput).toHaveValue('3');
  });

  test('should validate input and prevent saving zero if min is 1', async ({ page }) => {
    const downDuration = page.locator('#down-duration'); // min 1

    await downDuration.fill('0');
    await downDuration.blur();

    await expect(downDuration).toHaveClass(/input-error/);

    await page.reload();
    // Default is 2
    await expect(downDuration).toHaveValue('2');
  });
});
