import { AchievementSystem } from './achievement-system.js';

export const DataManager = {
  init() {
    const exportDataButton = document.getElementById('export-data-button');
    const importDataButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');

    if (exportDataButton) {
      exportDataButton.addEventListener('click', () => this.exportData());
    }
    if (importDataButton && importFileInput) {
      importDataButton.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
  },

  exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('squat-tracker-')) {
        data[key] = localStorage.getItem(key);
      }
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `squat-tracker-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof AchievementSystem !== 'undefined') {
      AchievementSystem.notify('backup');
    }
  },

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('現在のデータを上書きして復元しますか？この操作は取り消せません。')) {
      const importFileInput = document.getElementById('import-file-input');
      if (importFileInput) importFileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        this.importData(json);
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルか確認してください。');
        console.error(error);
      } finally {
        const importFileInput = document.getElementById('import-file-input');
        if (importFileInput) importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  },

  importData(data) {
    if (!data || typeof data !== 'object') {
      alert('データ形式が不正です。');
      return;
    }

    let count = 0;
    Object.keys(data).forEach(key => {
      if (key.startsWith('squat-tracker-')) {
        localStorage.setItem(key, data[key]);
        count++;
      }
    });

    if (count > 0) {
      alert('復元が完了しました。ページを再読み込みします。');
      window.location.reload();
    } else {
      alert('有効なデータが見つかりませんでした。');
    }
  }
};
