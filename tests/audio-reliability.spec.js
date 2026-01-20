const { test, expect } = require('@playwright/test');

test.describe('Audio & Voice Reliability', () => {
  test.beforeEach(async ({ page }) => {
    // Mock SpeechSynthesis and AudioContext before page load
    await page.addInitScript(() => {
      // Mock SpeechSynthesis
      window.mockSpeakCalls = [];
      const mockSynthesis = {
        getVoices: () => [
          { name: 'Google 日本語', lang: 'ja-JP', default: true },
          { name: 'English US', lang: 'en-US', default: false }
        ],
        speak: (utterance) => {
          window.mockSpeakCalls.push({
            text: utterance.text,
            lang: utterance.lang,
            voice: utterance.voice, // This checks if a specific voice object was assigned
          });
        },
        cancel: () => {},
        onvoiceschanged: null,
      };

      try {
        // Try deleting first (works in some browsers)
        delete window.speechSynthesis;
        window.speechSynthesis = mockSynthesis;
      } catch (err) {
        // Fallback to defineProperty
        Object.defineProperty(window, 'speechSynthesis', {
            value: mockSynthesis,
            writable: true,
            configurable: true,
        });
      }
      window.SpeechSynthesisUtterance = class {
        constructor(text) {
          this.text = text;
          this.lang = '';
          this.voice = null;
        }
      };

      // Mock AudioContext
      window.mockAudioContextInstances = [];
      window.AudioContext = class {
        constructor() {
          this.state = 'suspended';
          this.resumeCalls = 0;
          window.mockAudioContextInstances.push(this);
        }
        createOscillator() {
          return {
            frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
            connect: () => ({ connect: () => {} }),
            start: () => {},
            stop: () => {},
            type: 'triangle',
          };
        }
        createGain() {
          return {
            gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          };
        }
        get destination() { return {}; }
        get currentTime() { return 0; }
        async resume() {
          this.state = 'running';
          this.resumeCalls++;
        }
      };
      window.webkitAudioContext = window.AudioContext;
    });

    await page.goto('/');
  });

  test('VoiceCoach should explicitly select a Japanese voice', async ({ page }) => {
    // Enable Voice Coach
    // Click the label wrapper since the input is visually hidden
    await page.locator('.switch:has(#voice-toggle)').click();

    // Trigger a speech (e.g. by starting workout or just toggling which triggers a test speak)
    // The current implementation speaks "" (empty string) on toggle enable to unlock mobile audio.

    // We expect the speak call to have a voice object assigned, not just lang string
    // because relying on lang alone can sometimes pick the wrong variant on some devices.
    const speakCalls = await page.evaluate(() => window.mockSpeakCalls);
    expect(speakCalls.length).toBeGreaterThan(0);

    // NOTE: This assertion is expected to FAIL with the current implementation
    // because app.js currently does NOT assign utterance.voice, only utterance.lang.
    const lastCall = speakCalls[speakCalls.length - 1];
    expect(lastCall.lang).toBe('ja-JP');
    // We want to ensure a specific voice object is chosen
    expect(lastCall.voice).not.toBeNull();
    expect(lastCall.voice.lang).toBe('ja-JP');
  });

  test('AudioContext should be resumed on Start button click', async ({ page }) => {
    // Fill in workout settings to allow start
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '1');

    // Click Start
    await page.click('#start-button');

    // Check if AudioContext.resume() was called
    const resumeCalled = await page.evaluate(() => {
      const ctx = window.mockAudioContextInstances[0];
      return ctx && ctx.resumeCalls > 0;
    });

    // NOTE: This is expected to FAIL with current implementation
    // because app.js does not explicitly call resume() on start button click.
    expect(resumeCalled).toBe(true);
  });
});
