const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');

let serverProcess;

test.beforeAll(async () => {
  serverProcess = spawn('python3', ['-m', 'http.server', '8000'], {
    stdio: 'ignore', // Suppress output
    detached: true
  });
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
});

test.afterAll(() => {
  if (serverProcess) {
    process.kill(-serverProcess.pid); // Kill process group
  }
});

test.describe('Adventure Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to reset adventure state
    await page.goto('http://localhost:8000/index.html');
    await page.evaluate(() => {
      localStorage.clear();
      // Reset module state if possible, or rely on page reload
    });
    await page.reload();
  });

  test('should initialize and display the first area', async ({ page }) => {
    await expect(page.locator('#adventure-status')).toBeVisible();
    await expect(page.locator('.adventure-area-name')).toContainText('はじまりの草原');

    // Check initial avatar position (near 0%)
    const avatar = page.locator('.adventure-avatar');
    await expect(avatar).toBeVisible();
    const style = await avatar.getAttribute('style');
    expect(style).toContain('left: 0%');

    // Check background style (approximate check by class/existence)
    // We can check if body or background div has correct style, but computed style is hard.
    // Let's check if the module loaded correctly.
    const areaName = await page.evaluate(() => window.AdventureSystem.getCurrentArea().name);
    expect(areaName).toBe('はじまりの草原');
  });

  test('should advance node when boss is defeated', async ({ page }) => {
    // Force defeat a boss
    await page.evaluate(() => {
      // Simulate high damage to kill
      window.BossBattle.damage(9999);
    });

    // Wait for the "defeat" animation or logic to process
    await page.waitForTimeout(1500); // 1s defeat animation + buffer

    // Check if progress advanced
    // Assuming AdventureSystem.advance() was called
    const progress = await page.evaluate(() => window.AdventureSystem.getProgress());
    expect(progress.nodeIndex).toBe(1);

    // UI update check
    const avatar = page.locator('.adventure-avatar');
    // Calculate expected % for 10 nodes (0..9) -> index 1 is approx 11%
    // (1 / 9) * 100 = 11.11...
    const style = await avatar.getAttribute('style');
    expect(style).not.toContain('left: 0%');
  });

  test('should clear area and move to next area', async ({ page }) => {
    // Set state to last node of first area
    await page.evaluate(() => {
      localStorage.setItem('squat-tracker-adventure', JSON.stringify({
        currentAreaIndex: 0,
        currentNodeIndex: 9 // Last node (total 10)
      }));
    });
    await page.reload();

    await expect(page.locator('.adventure-area-name')).toContainText('はじまりの草原');

    // Defeat boss to clear area
    await page.evaluate(() => {
      window.BossBattle.damage(9999);
    });

    await page.waitForTimeout(1500);

    // Should now be in Area 2 (Forest)
    const areaName = await page.evaluate(() => window.AdventureSystem.getCurrentArea().name);
    expect(areaName).toBe('迷いの森');

    await expect(page.locator('.adventure-area-name')).toContainText('迷いの森');

    // Node should reset to 0
    const progress = await page.evaluate(() => window.AdventureSystem.getProgress());
    expect(progress.nodeIndex).toBe(0);
  });
});
