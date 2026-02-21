import { test, expect } from '@playwright/test';

test('Verify Commentary UI', async ({ page }) => {
  await page.goto('/');

  // Force visibility of the toggle input for visual verification context
  await page.addStyleTag({ content: '#commentary-toggle { opacity: 1 !important; width: 20px !important; height: 20px !important; z-index: 9999; }' });

  // Locate the control group
  const controlGroup = page.locator('.voice-controls').filter({ hasText: '実況解説' });
  await expect(controlGroup).toBeVisible();

  // Scroll to view
  await controlGroup.scrollIntoViewIfNeeded();

  // Toggle ON
  await page.locator('#commentary-toggle').check({ force: true });

  // Wait for update (allow retry)
  const status = page.locator('#commentary-status');
  await expect(status).toHaveText('ON');

  // Take screenshot of the settings area
  await page.screenshot({ path: 'tests/verification/verification-commentary-ui.png', clip: { x: 0, y: 0, width: 1280, height: 1200 } });
});
