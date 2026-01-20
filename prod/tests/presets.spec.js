const { test, expect } = require('@playwright/test');

test.describe('Workout Presets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load default presets on first visit', async ({ page }) => {
    const presetSelect = page.locator('#preset-select');
    await expect(presetSelect).toBeVisible();

    // Check for default options
    const options = await presetSelect.locator('option').allTextContents();
    // Assuming defaults are created with these names
    expect(options.some(o => o.includes('ノーマル'))).toBeTruthy();
    expect(options.some(o => o.includes('初心者'))).toBeTruthy();
  });

  test('should apply preset settings when selected', async ({ page }) => {
    // Select '初心者' preset. Using part of the text if exact match fails, but label usually requires exact match.
    // The default preset name is "初心者 (軽め)".
    await page.selectOption('#preset-select', { label: '初心者 (軽め)' });

    // Check if inputs are updated (assuming defaults: 2 sets, 5 reps)
    await expect(page.locator('#set-count')).toHaveValue('2');
    await expect(page.locator('#rep-count')).toHaveValue('5');
  });

  test('should save a new preset', async ({ page }) => {
    // Change settings
    await page.fill('#set-count', '5');
    await page.fill('#rep-count', '20');

    // Handle prompt dialog
    page.on('dialog', dialog => {
        if (dialog.type() === 'prompt') {
            return dialog.accept('My Custom Workout');
        }
        return dialog.accept();
    });

    // Click save
    await page.click('#save-preset-button');

    // Verify it appears in select
    const presetSelect = page.locator('#preset-select');
    // Verify the selected option text matches
    const selectedText = await presetSelect.locator('option:checked').textContent();
    expect(selectedText).toBe('My Custom Workout');

    // Reload and check persistence
    await page.reload();
    const options = await presetSelect.locator('option').allTextContents();
    expect(options).toContain('My Custom Workout');
  });

  test('should delete a preset', async ({ page }) => {
     // Create a preset first
     await page.fill('#set-count', '4');

     // Need to remove previous dialog listener or use 'once' carefully.
     // Here we just add a new listener that handles the flow.
     // Playwright dialog handling can be tricky if multiple are expected.

     let promptHandled = false;
     page.on('dialog', async dialog => {
        if (dialog.type() === 'prompt' && !promptHandled) {
            promptHandled = true;
            await dialog.accept('ToDelete');
        } else if (dialog.type() === 'confirm') {
            await dialog.accept();
        }
     });

     await page.click('#save-preset-button');

     // Select it (it should be auto-selected after save, but let's make sure)
     await page.selectOption('#preset-select', { label: 'ToDelete' });

     // Click delete
     await page.click('#delete-preset-button');

     // Verify it's gone
     const options = await page.locator('#preset-select option').allTextContents();
     expect(options).not.toContain('ToDelete');

     // Verify selection is reset
     await expect(page.locator('#preset-select')).toHaveValue('');
  });
});
