import { test, expect } from '@playwright/test';

test('GhostManager logic verification', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/index.html');

  // Wait for app to load
  await expect(page.locator('#phase-display')).toBeVisible();

  await page.evaluate(() => {
    // Setup container
    const container = document.createElement('div');
    container.id = 'test-progress-container';
    container.style.width = '100px';
    container.style.height = '10px';
    document.body.appendChild(container);

    // 1. Linear Mode Test
    window.GhostManager.init({
      targetDuration: 10000,
      containerId: 'test-progress-container',
      markerId: 'test-ghost-marker-1'
    });

    window.GhostManager.update(5000);
    const marker1 = document.getElementById('test-ghost-marker-1');
    if (!marker1) throw new Error('Marker 1 not created');
    if (marker1.style.left !== '50%') throw new Error(`Linear 50%: Expected 50%, got ${marker1.style.left}`);

    // 2. Replay Mode Test
    window.GhostManager.init({
      historyEntry: { timeline: [5000, 10000], totalReps: 2 },
      containerId: 'test-progress-container',
      markerId: 'test-ghost-marker-2'
    });

    const marker2 = document.getElementById('test-ghost-marker-2');

    // 2500ms -> 25%
    window.GhostManager.update(2500);
    if (marker2.style.left !== '25%') throw new Error(`Replay 25%: Expected 25%, got ${marker2.style.left}`);

    // 7500ms -> 75%
    window.GhostManager.update(7500);
    if (marker2.style.left !== '75%') throw new Error(`Replay 75%: Expected 75%, got ${marker2.style.left}`);

    // 10000ms -> 100%
    window.GhostManager.update(10000);
    // Note: implementation says elapsedTime < timeline[i]. 10000 < 10000 is false.
    // Loop finishes. currentRepIndex remains -1.
    // if (currentRepIndex === -1) progress = 1.0. Correct.
    if (marker2.style.left !== '100%') throw new Error(`Replay 100%: Expected 100%, got ${marker2.style.left}`);
  });
});
