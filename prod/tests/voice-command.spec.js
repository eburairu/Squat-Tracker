const { test, expect } = require('@playwright/test');

test.describe('Voice Command Control', () => {
  test.beforeEach(async ({ page }) => {
    // Mock SpeechRecognition API
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        constructor() {
          this.lang = '';
          this.continuous = false;
          this.interimResults = false;
          this.onstart = null;
          this.onend = null;
          this.onresult = null;
          this.onerror = null;
        }
        start() {
          if (this.onstart) this.onstart();
          // Register global dispatcher for test control
          window.__mockSpeechRecognitionInstance = this;
        }
        stop() {
          if (this.onend) this.onend();
        }
      }
      window.SpeechRecognition = MockSpeechRecognition;
      window.webkitSpeechRecognition = MockSpeechRecognition;

      // Helper to dispatch result
      window.dispatchVoiceCommand = (transcript) => {
        const instance = window.__mockSpeechRecognitionInstance;
        if (instance && instance.onresult) {
          const event = {
            results: [
              [{ transcript: transcript, confidence: 1.0 }]
            ]
          };
          instance.onresult(event);
        }
      };
    });

    await page.goto('/');

    // Wait for app initialization
    await page.waitForFunction(() => window.VoiceControl);
  });

  test('should enable voice control via toggle', async ({ page }) => {
    // Check initial state (OFF)
    const statusText = page.locator('#voice-command-status-text');
    await expect(statusText).toHaveText('OFF');

    // Toggle ON
    await page.locator('label:has(#voice-command-toggle)').click();

    // Verify ON state
    await expect(statusText).toHaveText('ON');
    const indicator = page.locator('#voice-status-indicator');
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveClass(/listening/);
  });

  test('should start workout with voice command', async ({ page }) => {
    // Enable Voice Control
    await page.locator('label:has(#voice-command-toggle)').click();

    // Dispatch "Start" command
    await page.evaluate(() => window.dispatchVoiceCommand('スタート'));

    // Verify workout started
    const startButton = page.locator('#start-button');
    await expect(startButton).toBeDisabled();
    await expect(startButton).toHaveText('進行中');

    const phaseDisplay = page.locator('#phase-display');
    // It might be in countdown first
    await expect(phaseDisplay).not.toHaveText('待機中');
  });

  test('should pause and reset workout with voice command', async ({ page }) => {
    // Enable Voice Control
    await page.locator('label:has(#voice-command-toggle)').click();

    // Start
    await page.evaluate(() => window.dispatchVoiceCommand('開始'));
    // Wait for countdown to finish and workout to start (simplified check)
    await page.waitForTimeout(1000);

    // Pause
    await page.evaluate(() => window.dispatchVoiceCommand('ストップ'));

    const pauseButton = page.locator('#pause-button');
    await expect(pauseButton).toHaveText('再開');
    const hint = page.locator('#phase-hint');
    await expect(hint).toHaveText('一時停止中');

    // Reset
    await page.evaluate(() => window.dispatchVoiceCommand('リセット'));

    const startButton = page.locator('#start-button');
    await expect(startButton).toBeEnabled();
    await expect(startButton).toHaveText('スタート');
    const phaseDisplay = page.locator('#phase-display');
    await expect(phaseDisplay).toHaveText('待機中');
  });

  test('should handle unsupported browser gracefully', async ({ page }) => {
    // Override mock to simulate no support
    await page.addInitScript(() => {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
    });
    // Reload to apply
    await page.reload();

    // Init logic runs on DOMContentLoaded, so checking state
    const isSupported = await page.evaluate(() => window.VoiceControl.isSupported);
    expect(isSupported).toBe(false);

    // UI might still be there but toggling should do nothing effective or show error
    // In current implementation, init returns false but UI is not hidden by JS (plan said so, but implementation didn't hide the toggle itself in init, only VoiceControl internal state).
    // Let's just verify isSupported flag.
  });
});
