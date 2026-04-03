import { showToast } from '../utils.js';

export const ActiveRecovery = {
  isActive: false,
  savedSettings: null,

  init() {
    const toggle = document.getElementById('active-recovery-toggle');
    const statusText = document.getElementById('active-recovery-status');

    if (!toggle) return;

    toggle.addEventListener('change', (e) => {
      this.isActive = e.target.checked;

      if (statusText) {
        statusText.textContent = this.isActive ? 'ON' : 'OFF';
      }

      const setCountInput = document.getElementById('set-count');
      const repCountInput = document.getElementById('rep-count');
      const downInput = document.getElementById('down-duration');
      const holdInput = document.getElementById('hold-duration');
      const upInput = document.getElementById('up-duration');

      if (!setCountInput || !repCountInput || !downInput || !holdInput || !upInput) return;

      if (this.isActive) {
        // 現在の設定を保存
        this.savedSettings = {
          setCount: setCountInput.value,
          repCount: repCountInput.value,
          downDuration: downInput.value,
          holdDuration: holdInput.value,
          upDuration: upInput.value
        };

        // Active Recovery用の軽い設定を強制
        setCountInput.value = 1;
        repCountInput.value = 5;
        downInput.value = 3; // ゆっくりしゃがむ
        holdInput.value = 1; // 1秒キープ
        upInput.value = 2;   // ゆっくり立つ

        // フォームを無効化してユーザーが変更できないようにする
        setCountInput.disabled = true;
        repCountInput.disabled = true;
        downInput.disabled = true;
        holdInput.disabled = true;
        upInput.disabled = true;

        showToast({
          emoji: '🛌',
          title: '休息日モードON',
          message: '無理せず軽い運動でストリークを維持しましょう。報酬・ダメージは無効になります。'
        });
      } else {
        // 設定を復元
        if (this.savedSettings) {
          setCountInput.value = this.savedSettings.setCount;
          repCountInput.value = this.savedSettings.repCount;
          downInput.value = this.savedSettings.downDuration;
          holdInput.value = this.savedSettings.holdDuration;
          upInput.value = this.savedSettings.upDuration;
        }

        // フォームを有効化
        setCountInput.disabled = false;
        repCountInput.disabled = false;
        downInput.disabled = false;
        holdInput.disabled = false;
        upInput.disabled = false;

        showToast({
          emoji: '🔥',
          title: '休息日モードOFF',
          message: '通常モードに戻りました。トレーニングを再開しましょう！'
        });
      }

      // 値の変更をApp.jsなどに認識させるためイベント発火
      setCountInput.dispatchEvent(new Event('input', { bubbles: true }));
      setCountInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
};
