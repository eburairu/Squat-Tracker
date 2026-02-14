const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 1. Appを開く
    await page.goto('http://localhost:8000');

    // 2. localStorageにデータをセット (Lv2 Warrior)
    await page.evaluate(() => {
        const key = 'squat-tracker-class-mastery';
        // Warrior: Lv2 (100 EXP) -> 1 SP
        const data = { 'warrior': { exp: 100, unlockedNodes: [] } };
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem('squat-tracker-class', 'warrior');
    });

    // 3. リロードして反映
    await page.reload();

    // 4. クラス設定を開く
    await page.click('#open-class-settings');
    await page.waitForTimeout(500); // Wait for modal animation

    // 5. マスタリータブをクリック
    await page.click('.modal-tab-btn[data-target="skill-tree"]');
    await page.waitForTimeout(500); // Wait for tab switch animation

    // 6. スクリーンショットを撮る
    await page.screenshot({ path: 'verification/class-mastery.png' });

    console.log('Screenshot taken: verification/class-mastery.png');

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
})();
