import { test, expect } from '@playwright/test';

test('Verify Buddy UI', async ({ page }) => {
  await page.goto('/');

  // Wait for init
  await page.waitForFunction(() => window.BuddyManager && window.InventoryManager);

  // Add Buddy
  await page.evaluate(() => {
      window.BuddyManager._reset();
      window.BuddyManager._forceAdd(0); // Slime
      // Give some exp
      window.BuddyManager.addExp(25);
  });

  // Open Modal
  await page.click('#equipment-button');
  await page.waitForSelector('#equipment-modal.active');

  // Click Tab (Force Active for screenshot stability)
  await page.click('button[data-target="buddy-view"]');
  await page.evaluate(() => {
      const el = document.getElementById('buddy-view');
      if(el) {
          el.classList.add('active');
          el.style.display = 'block';
      }
  });
  await page.waitForSelector('#buddy-view', { state: 'visible' });

  // Take Screenshot
  await page.screenshot({ path: 'verification/buddy_ui.png' });
});
