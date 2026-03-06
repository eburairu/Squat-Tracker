const { test, expect } = require('@playwright/test');

test.describe('Voice Persona Logic', () => {
  test.beforeEach(async ({ page }) => {
    // モック：Web Speech API
    await page.addInitScript(() => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          getVoices: () => [{ name: 'Haruka', lang: 'ja-JP', default: true }],
          speak: (utterance) => { window.lastUtterance = utterance; },
          cancel: () => {},
          onvoiceschanged: null,
        },
        writable: true
      });

      class MockUtterance {
        constructor(text) {
          this.text = text;
          this.lang = '';
          this.voice = null;
          this.rate = 1.0;
          this.pitch = 1.0;
          this.volume = 1.0;
        }
      }
      window.SpeechSynthesisUtterance = MockUtterance;
      window.lastUtterance = null;
    });

    // データ初期化
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // VoiceCoachを有効化してテスト準備
    await page.evaluate(() => {
      window.VoiceCoach.setEnabled(true);
    });
  });

  test('UIからペルソナを選択し、発話内容とパラメータが切り替わるか', async ({ page }) => {
    // 1. UIを開き、初期状態の確認
    await page.click('#open-settings');
    await page.waitForSelector('#settings-modal', { state: 'visible' });

    // 2. デフォルトペルソナ（標準コーチ）の動作確認
    await page.evaluate(async () => {
      window.lastUtterance = null;
      window.VoiceCoach.play('down', 'しゃがんで（デフォルト）');
      await new Promise(r => setTimeout(r, 100)); // wait for utterance to be set
    });

    let utterance = await page.evaluate(() => window.lastUtterance);
    expect(utterance).not.toBeNull();
    expect(utterance.text).toBe('しゃがんで'); // personas.json の default に定義されている文字列
    expect(utterance.pitch).toBe(1.0);
    expect(utterance.rate).toBe(1.0);

    // 3. UIから「熱血コーチ」を選択
    await page.selectOption('#voice-persona-select', 'hotblooded');

    // 4. 選択後の発話動作確認
    await page.evaluate(async () => {
      window.lastUtterance = null;
      window.VoiceCoach.play('down', 'しゃがんで（デフォルト）');
      await new Promise(r => setTimeout(r, 100));
    });

    utterance = await page.evaluate(() => window.lastUtterance);
    expect(utterance).not.toBeNull();
    expect(utterance.text).toBe('もっと深く！限界を超えろ！');
    expect(utterance.pitch).toBe(0.8);
    expect(utterance.rate).toBe(1.2);

    // 5. 定義されていないキーを渡した場合のフォールバック動作確認
    await page.evaluate(async () => {
      window.lastUtterance = null;
      window.VoiceCoach.play('unknown_action', 'フォールバックのテキスト');
      await new Promise(r => setTimeout(r, 100));
    });

    utterance = await page.evaluate(() => window.lastUtterance);
    expect(utterance).not.toBeNull();
    expect(utterance.text).toBe('フォールバックのテキスト');
    expect(utterance.pitch).toBe(0.8);
    expect(utterance.rate).toBe(1.2);

    // 6. ローカルストレージへの保存確認
    const storedPersona = await page.evaluate(() => localStorage.getItem('squat-tracker-voice-persona'));
    expect(storedPersona).toBe('hotblooded');
  });

  test('古い speak メソッドの互換性が保たれているか', async ({ page }) => {
    // UIを開いてVoiceCoachを初期化させる（Playwright内で初期化のタイミングに依存するため）
    await page.click('#open-settings');
    await page.waitForSelector('#settings-modal', { state: 'visible' });

    // evaluate内で非同期の処理があるかもしれないので、Utteranceがセットされるまで待つ
    await page.evaluate(async () => {
      window.lastUtterance = null;
      window.VoiceCoach.setPersona('cool');
      window.VoiceCoach.speak('生のテキストです');
      await new Promise(r => setTimeout(r, 100));
    });

    const utterance = await page.evaluate(() => window.lastUtterance);
    expect(utterance).not.toBeNull();
    // テキストはそのまま
    expect(utterance.text).toBe('生のテキストです');
    // パラメータはペルソナのものが適用される
    expect(utterance.pitch).toBe(1.2);
    expect(utterance.rate).toBe(0.9);
  });
});
