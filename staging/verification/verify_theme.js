const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to see modal clearly
  await page.setViewportSize({ width: 1280, height: 800 });

  try {
    await page.goto('http://localhost:4173');

    // Open Settings
    await page.click('#open-settings');
    await page.waitForTimeout(500); // Wait for animation

    // Take screenshot of settings modal
    await page.screenshot({ path: 'verification/settings-modal.png' });

    // Select Forest Theme
    await page.click('label.theme-option:has(input[value="forest"])');
    await page.waitForTimeout(500);

    // Close modal to see effect on background
    const closeBtn = await page.locator('#settings-modal .close-modal').first();
    // Force click because modal overlay might intercept? Or just click overlay.
    // The close button is .ghost.small.close-modal inside modal-header
    await closeBtn.click();
    await page.waitForTimeout(500);

    // Screenshot of Forest Theme applied
    await page.screenshot({ path: 'verification/theme-forest.png' });

    console.log('Verification screenshots captured.');
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
