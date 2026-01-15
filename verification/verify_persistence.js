const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Start server
  const serverProcess = spawn('python3', ['-m', 'http.server', '8081'], {
    stdio: 'ignore'
  });

  try {
    // Wait for server
    await new Promise(r => setTimeout(r, 1000));

    await page.goto('http://localhost:8081');

    // Change settings
    await page.fill('#set-count', '5');
    await page.fill('#rep-count', '20');
    await page.dispatchEvent('#set-count', 'change');
    await page.dispatchEvent('#rep-count', 'change');

    // Reload
    await page.reload();

    // Scroll to settings area
    const settingsCard = page.locator('.control-card');
    await settingsCard.scrollIntoViewIfNeeded();

    // Take screenshot
    const screenshotPath = path.join(__dirname, 'verification.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

  } catch (e) {
    console.error(e);
  } finally {
    serverProcess.kill();
    await browser.close();
  }
})();
