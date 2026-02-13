import { test, expect } from '@playwright/test';

test.describe('Workout Playlist System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to ensure fresh start
    await page.evaluate(() => localStorage.clear());
    // Wait for app initialization
    await page.waitForFunction(() => window.PlaylistManager);
  });

  test('should create a new playlist with multiple sessions', async ({ page }) => {
    // Open Playlist Manager
    await page.click('#manage-playlist-button');
    const modal = page.locator('#playlist-modal');
    await expect(modal).toHaveClass(/active/);

    // Click Create New
    await page.click('#create-playlist-btn');

    // Fill Name
    await page.fill('#playlist-name-input', 'Test Playlist');

    // Add Sessions (Presets)
    // Wait for options to populate
    const presetSelect = page.locator('#playlist-editor-preset-select');
    await expect(presetSelect).toBeVisible();

    // Add 1st Session
    // Select by label if possible, or index. Default presets: 'ノーマル (標準)', '初心者 (軽め)', 'スロー (じっくり)'
    // We select by value actually, which is the name.
    await presetSelect.selectOption({ label: 'ノーマル (標準)' });
    await page.click('#playlist-add-session-btn');

    // Add 2nd Session
    await presetSelect.selectOption({ label: '初心者 (軽め)' });
    await page.click('#playlist-add-session-btn');

    // Verify list items in editor
    const items = page.locator('#playlist-editor-items .editor-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('ノーマル (標準)');
    await expect(items.nth(1)).toContainText('初心者 (軽め)');

    // Save
    await page.click('#playlist-save-btn');

    // Verify it appears in the list view
    const playlistItem = page.locator('.playlist-item-name', { hasText: 'Test Playlist' });
    await expect(playlistItem).toBeVisible();

    // Close Modal
    await page.click('#playlist-modal .close-modal');
    await expect(modal).not.toHaveClass(/active/);

    // Verify it appears in main selection
    const mainSelect = page.locator('#playlist-select');
    // Reload options might be needed if select isn't reactive to modal close,
    // but our code updates the select options on save/init.
    // Let's verify text content
    await expect(mainSelect).toContainText('Test Playlist');
  });

  test('should load and play a playlist session', async ({ page }) => {
    // Pre-seed a playlist via localStorage
    await page.evaluate(() => {
      const playlist = {
        id: 'test-pl-1',
        name: 'Auto Test Playlist',
        items: [
          { name: 'Session 1', settings: { setCount: 1, repCount: 1, downDuration: 1, holdDuration: 1, upDuration: 1, restDuration: 10, countdownDuration: 3 } },
          { name: 'Session 2', settings: { setCount: 1, repCount: 5, downDuration: 1, holdDuration: 1, upDuration: 1, restDuration: 10, countdownDuration: 3 } }
        ],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('squat-tracker-playlists', JSON.stringify([playlist]));
    });

    // Reload page to pick up storage
    await page.reload();
    await page.waitForFunction(() => window.PlaylistManager);

    // Wait for options to be populated
    await page.waitForFunction(() => document.getElementById('playlist-select').options.length > 1);

    // Select the playlist
    const select = page.locator('#playlist-select');
    // Playwright selectOption can match value, label or index.
    // Our value is ID.
    await select.selectOption({ value: 'test-pl-1' });

    // Verify indicator
    const indicator = page.locator('#playlist-status-indicator');
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText('1/2 Session 1');

    // Verify inputs loaded (Session 1 has 1 rep)
    const repInput = page.locator('#rep-count');
    await expect(repInput).toHaveValue('1');

    // Start Workout
    await page.click('#start-button');
    const startBtn = page.locator('#start-button');
    await expect(startBtn).toBeDisabled();

    // Force finish session 1
    // Wait for workout started
    await expect(page.locator('#start-button')).toHaveText('進行中');

    await page.evaluate(() => {
      window.finishWorkout();
    });

    // Wait for auto-load of next session (2 seconds delay in code)
    await page.waitForTimeout(2500);

    // Verify Session 2 loaded
    await expect(indicator).toContainText('2/2 Session 2');
    const repInput2 = page.locator('#rep-count');
    await expect(repInput2).toHaveValue('5');

    // Verify start button enabled again (waiting for user to start next session)
    await expect(startBtn).toBeEnabled();
    await expect(startBtn).toHaveText('スタート');
  });
});
