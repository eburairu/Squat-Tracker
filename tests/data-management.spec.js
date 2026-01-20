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

  test('should handle object values in import data correctly', async ({ page }) => {
    // This simulates a manually edited JSON where values are objects, not strings
    const backupData = {
      'squat-tracker-complex-data': { level: 5, items: ['sword'] }
    };

    const tempFile = path.join('tests', 'temp-backup-complex.json');
    fs.writeFileSync(tempFile, JSON.stringify(backupData));

    try {
      page.on('dialog', dialog => dialog.accept());

      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('#import-data-button').click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(tempFile);

      await page.waitForTimeout(1000);

      const storedValue = await page.evaluate(() => localStorage.getItem('squat-tracker-complex-data'));
      // The stored value should be a stringified JSON, not "[object Object]"
      expect(storedValue).toBe(JSON.stringify(backupData['squat-tracker-complex-data']));
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
