const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');

  // Wait for load
  await page.waitForFunction(() => window.ComboSystem);

  // Set combo to 5 to show UI with colors (Blue)
  await page.evaluate(() => {
    window.ComboSystem.value = 5;
    window.ComboSystem.updateUI(true);
  });

  // Also force Miss effect for variety? No, let's just see the combo.

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/combo-preview.png' });

  await browser.close();
})();
