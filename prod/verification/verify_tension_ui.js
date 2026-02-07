const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to app
  await page.goto('http://127.0.0.1:4173/index.html');

  // Wait for TensionManager
  await page.waitForFunction(() => window.TensionManager);

  // Take screenshot of initial state
  await page.screenshot({ path: 'verification/initial.png' });

  // Add tension to trigger boost
  await page.evaluate(() => {
    window.TensionManager.add(100);
  });

  // Wait for boost class
  await page.waitForSelector('body.boost-mode');

  // Take screenshot of boost state
  await page.screenshot({ path: 'verification/boost.png' });

  await browser.close();
})();
