const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display export and import buttons', async ({ page }) => {
    const card = page.locator('#data-management-card');
    await expect(card).toBeVisible();
    await expect(page.locator('#export-data-button')).toBeVisible();
    await expect(page.locator('#import-data-button')).toBeVisible();
  });

  test('should export data as JSON', async ({ page }) => {
    // Setup some data
    await page.evaluate(() => {
      localStorage.setItem('squat-tracker-test-export', 'export-value');
    });

    // Mock download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-data-button').click();
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/^squat-tracker-backup-.*\.json$/);

    // Verify content
    const filePath = await download.path();
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    expect(json['squat-tracker-test-export']).toBe('export-value');
  });

  test('should import data and reload', async ({ page }) => {
    const backupData = {
      'squat-tracker-test-import': 'imported-value'
    };

    // Create a temporary file for upload
    const tempFile = path.join('tests', 'temp-backup.json');
    fs.writeFileSync(tempFile, JSON.stringify(backupData));

    try {
      // Mock confirm dialog to accept
      page.on('dialog', dialog => dialog.accept());

      // Trigger file chooser
      const fileChooserPromise = page.waitForEvent('filechooser');
      // The import button should trigger the file input click
      // Usually the button clicks the hidden input.
      // If the UI is implemented as a label for input, or button triggering click on input.
      await page.locator('#import-data-button').click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(tempFile);

      // Wait for page reload (implied by requirement) or data update
      // We'll assume the app reloads to apply changes
      await page.waitForTimeout(1000); // Wait for processing

      // Verify data in localStorage
      const value = await page.evaluate(() => localStorage.getItem('squat-tracker-test-import'));
      expect(value).toBe('imported-value');
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
