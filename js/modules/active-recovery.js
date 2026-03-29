export const ActiveRecovery = {
  isActive: false,
  savedSettings: null,
  toggleElement: null,
  statusElement: null,

  SETTINGS: {
    setCount: 1,
    repCount: 10,
    downDuration: 3,
    holdDuration: 2,
    upDuration: 3,
    restDuration: 30, // 1セットなので使用されないがデフォルト値
    countdownDuration: 5
  },

  init() {
    this.toggleElement = document.getElementById('recovery-mode-toggle');
    this.statusElement = document.getElementById('recovery-mode-status');

    if (!this.toggleElement) return;

    this.toggleElement.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (isChecked) {
        this.turnOn();
      } else {
        this.turnOff();
      }
    });
  },

  turnOn() {
    this.isActive = true;
    if (this.toggleElement) this.toggleElement.checked = true;
    if (this.statusElement) this.statusElement.textContent = 'ON';

    const setCountInput = document.getElementById('set-count');
    const repCountInput = document.getElementById('rep-count');
    const downDurationInput = document.getElementById('down-duration');
    const holdDurationInput = document.getElementById('hold-duration');
    const upDurationInput = document.getElementById('up-duration');
    const restDurationInput = document.getElementById('rest-duration');
    const countdownDurationInput = document.getElementById('countdown-duration');

    // 現在の設定を退避
    this.savedSettings = {
      setCount: setCountInput?.value,
      repCount: repCountInput?.value,
      downDuration: downDurationInput?.value,
      holdDuration: holdDurationInput?.value,
      upDuration: upDurationInput?.value,
      restDuration: restDurationInput?.value,
      countdownDuration: countdownDurationInput?.value
    };

    // 固定値を適用
    const inputs = [
      { el: setCountInput, val: this.SETTINGS.setCount },
      { el: repCountInput, val: this.SETTINGS.repCount },
      { el: downDurationInput, val: this.SETTINGS.downDuration },
      { el: holdDurationInput, val: this.SETTINGS.holdDuration },
      { el: upDurationInput, val: this.SETTINGS.upDuration },
      { el: restDurationInput, val: this.SETTINGS.restDuration },
      { el: countdownDurationInput, val: this.SETTINGS.countdownDuration }
    ];

    inputs.forEach(({ el, val }) => {
      if (el) {
        el.value = val;
        el.disabled = true;
        // changeイベントは発火させない（設定の永続的な上書きを防ぐため）
        el.dispatchEvent(new Event('input'));
      }
    });
  },

  turnOff() {
    if (!this.isActive) return;
    this.isActive = false;
    if (this.toggleElement) this.toggleElement.checked = false;
    if (this.statusElement) this.statusElement.textContent = 'OFF';

    const setCountInput = document.getElementById('set-count');
    const repCountInput = document.getElementById('rep-count');
    const downDurationInput = document.getElementById('down-duration');
    const holdDurationInput = document.getElementById('hold-duration');
    const upDurationInput = document.getElementById('up-duration');
    const restDurationInput = document.getElementById('rest-duration');
    const countdownDurationInput = document.getElementById('countdown-duration');

    const inputs = [
      { el: setCountInput, key: 'setCount' },
      { el: repCountInput, key: 'repCount' },
      { el: downDurationInput, key: 'downDuration' },
      { el: holdDurationInput, key: 'holdDuration' },
      { el: upDurationInput, key: 'upDuration' },
      { el: restDurationInput, key: 'restDuration' },
      { el: countdownDurationInput, key: 'countdownDuration' }
    ];

    inputs.forEach(({ el, key }) => {
      if (el) {
        el.disabled = false;
        // 退避した値を復元
        if (this.savedSettings && this.savedSettings[key] !== undefined) {
          el.value = this.savedSettings[key];
        }
        el.dispatchEvent(new Event('input'));
        // 復元した値で保存し直す
        el.dispatchEvent(new Event('change'));
      }
    });

    this.savedSettings = null;
  }
};
