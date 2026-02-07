const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Visit App
  await page.goto('http://localhost:8000/index.html');
  await page.waitForFunction(() => window.CommitmentManager);

  // 2. Show Modal
  await page.evaluate(() => {
    window.CommitmentManager.showModal();
  });
  // Wait for transition if needed, though active class is instant
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/commitment-modal.png' });

  // 3. Set Commitment & Show Status
  await page.evaluate(() => {
    window.CommitmentManager.setCommitment('tomorrow');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/commitment-status.png' });

  await browser.close();
})();
