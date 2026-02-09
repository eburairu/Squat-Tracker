const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('http://localhost:8000/index.html');

  // Start workout to see combo
  await page.fill('#set-count', '1');
  await page.fill('#rep-count', '5');
  await page.fill('#down-duration', '1');
  await page.fill('#hold-duration', '1');
  await page.fill('#up-duration', '1');
  await page.fill('#rest-duration', '10');
  await page.fill('#countdown-duration', '3');

  await page.click('#start-button');

  // Wait for 1 Combo! (Approx 3+3 = 6s)
  await page.waitForTimeout(7000);

  // Take screenshot
  await page.screenshot({ path: 'verification/combo-screenshot.png' });

  await browser.close();
})();
