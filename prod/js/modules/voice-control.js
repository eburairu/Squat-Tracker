import { showToast } from '../utils.js';

export const VoiceControl = {
  recognition: null,
  isSupported: false,
  isEnabled: false,
  isListening: false,
  callbacks: {},
  restartTimer: null,

  // コマンド定義
  commands: {
    start: ['スタート', '開始', 'レッツゴー', 'いくぞ', 'はい'],
    pause: ['ストップ', '止めて', '一時停止', '待って', '休憩'],
    reset: ['リセット', '最初から', 'やめる', '終わり']
  },

  init(callbacks) {
    this.callbacks = callbacks || {};

    // ブラウザ互換性チェック
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('VoiceControl: SpeechRecognition API is not supported in this browser.');
      this.isSupported = false;
      return false;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'ja-JP';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false; // 単発認識でループさせる方が安定するケースが多い

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateUIState();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateUIState();

      // 有効状態なら再起動（ループ）
      if (this.isEnabled) {
        // 即時再開だとエラーになることがあるので少し待つ
        this.restartTimer = setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e) {
            // 既に開始されている場合などは無視
          }
        }, 500);
      }
    };

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim().toLowerCase();

      // 開発用ログ
      console.log(`Voice recognized: ${transcript}`);

      this.processCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('VoiceControl Error:', event.error);
      // エラー時の挙動: 'no-speech' などは無視して再試行対象とするが
      // 'not-allowed' の場合は無効化する
      if (event.error === 'not-allowed') {
        this.setEnabled(false);
        showToast({ emoji: '🚫', title: 'マイク許可エラー', message: 'マイクの使用が拒否されました。設定を確認してください。' });
      }
    };

    return true;
  },

  setEnabled(enabled) {
    if (!this.isSupported) return;

    this.isEnabled = enabled;

    if (enabled) {
      try {
        this.recognition.start();
        showToast({ emoji: '🎙️', title: '音声操作 ON', message: '「スタート」「ストップ」と話しかけてください。' });
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    } else {
      this.recognition.stop();
      if (this.restartTimer) {
        clearTimeout(this.restartTimer);
        this.restartTimer = null;
      }
      showToast({ emoji: '🔇', title: '音声操作 OFF', message: '音声認識を停止しました。' });
    }
    this.updateUIState();
  },

  processCommand(transcript) {
    // 完全に一致するか、コマンドが含まれているか
    const match = (keywords) => keywords.some(k => transcript.includes(k));

    if (match(this.commands.start)) {
      if (this.callbacks.start) {
        this.callbacks.start();
        showToast({ emoji: '▶️', title: '音声コマンド', message: 'スタート！' });
      }
    } else if (match(this.commands.pause)) {
      if (this.callbacks.pause) {
        this.callbacks.pause();
        showToast({ emoji: '⏸️', title: '音声コマンド', message: '一時停止/再開' });
      }
    } else if (match(this.commands.reset)) {
      if (this.callbacks.reset) {
        this.callbacks.reset();
        showToast({ emoji: '🔄', title: '音声コマンド', message: 'リセット' });
      }
    }
  },

  updateUIState() {
    const indicator = document.getElementById('voice-status-indicator');
    if (!indicator) return;

    if (this.isEnabled) {
      indicator.classList.remove('hidden');
      if (this.isListening) {
        indicator.classList.add('listening');
        indicator.title = '音声認識中...';
      } else {
        indicator.classList.remove('listening');
        indicator.title = '待機中';
      }
    } else {
      indicator.classList.add('hidden');
      indicator.classList.remove('listening');
    }

    const toggle = document.getElementById('voice-command-toggle');
    if (toggle) {
      // input type="checkbox" の場合は checked プロパティを更新
      if (toggle.type === 'checkbox') {
        toggle.checked = this.isEnabled;
      }
      toggle.setAttribute('aria-pressed', this.isEnabled);

      // テキスト表示の更新もここで行うのが理想的だが、今回はapp.js側でもやっている。
      // モジュール内で完結させるためにステータステキストも更新する。
      const statusText = document.getElementById('voice-command-status-text');
      if (statusText) {
        statusText.textContent = this.isEnabled ? 'ON' : 'OFF';
      }
    }
  }
};
