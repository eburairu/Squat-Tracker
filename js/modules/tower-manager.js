import { showToast } from '../utils.js';

export const TowerManager = {
  state: {
    isActive: false,
    currentFloor: 1,
    playerHp: 100,
    maxPlayerHp: 100,
    enemy: {
      maxHp: 100,
      currentHp: 100,
      name: 'Tower Keeper',
      emoji: '👻'
    },
    highScore: 0
  },
  elements: {},
  _originalSetCount: null,
  _originalEncounterCheck: null,

  init() {
    this.elements = {
      entryCard: document.getElementById('tower-entry-card'),
      battleCard: document.getElementById('tower-battle-card'),
      startBtn: document.getElementById('tower-start-button'),
      retreatBtn: document.getElementById('tower-retreat-button'),
      highScore: document.getElementById('tower-highscore'),
      floorDisplay: document.getElementById('tower-floor-display'),
      playerHpText: document.getElementById('tower-player-hp-text'),
      playerHpBar: document.getElementById('tower-player-hp-bar'),
      enemyName: document.getElementById('tower-enemy-name'),
      enemyHpText: document.getElementById('tower-enemy-hp-text'),
      enemyHpBar: document.getElementById('tower-enemy-hp-bar'),
      enemyAvatar: document.getElementById('tower-enemy-avatar'),
      bossCard: document.getElementById('boss-card') // 表示/非表示切り替え用
    };

    if (this.elements.startBtn) {
      this.elements.startBtn.addEventListener('click', () => {
        // window.startWorkout はグローバル関数として定義されているため、これを利用してワークアウトを開始
        // その前にタワーモードを有効化する
        if (typeof window.startWorkout === 'function') {
           this.startTower();
           window.startWorkout();
        }
      });
    }

    if (this.elements.retreatBtn) {
      this.elements.retreatBtn.addEventListener('click', () => {
        if (confirm('リタイアしますか？記録はここまでとなります。')) {
          this.endTower(false); // Game Over扱いとして終了
          if (typeof window.finishWorkout === 'function') {
            window.finishWorkout();
          }
        }
      });
    }

    this.loadHighScore();
    this.renderEntry();
  },

  loadHighScore() {
    const saved = localStorage.getItem('squat-tracker-tower-highscore');
    if (saved) {
      this.state.highScore = parseInt(saved, 10) || 0;
    }
  },

  saveHighScore() {
    // 現在の階層がハイスコアより大きければ更新
    // 仕様では「到達階層」を競うため、currentFloorをそのまま保存する

    if (this.state.currentFloor > this.state.highScore) {
      this.state.highScore = this.state.currentFloor;
      localStorage.setItem('squat-tracker-tower-highscore', this.state.highScore);
      return true; // 新記録
    }
    return false;
  },

  startTower() {
    this.state.isActive = true;
    this.state.currentFloor = 1;
    this.state.playerHp = 100;

    // UI切り替え
    if (this.elements.bossCard) this.elements.bossCard.style.display = 'none';
    if (this.elements.entryCard) this.elements.entryCard.style.display = 'none';
    if (this.elements.battleCard) this.elements.battleCard.style.display = 'block';

    // ワークアウト設定の上書き (1セット設定だが、手動でループさせる)
    // 早期終了を防ぐため、セット数を大きな値に設定
    const setCountInput = document.getElementById('set-count');
    if (setCountInput) {
       this._originalSetCount = setCountInput.value;
       setCountInput.value = 999;
       setCountInput.dispatchEvent(new Event('change'));
    }

    // ランダムイベント（Encounter）の無効化
    if (window.EncounterManager) {
      this._originalEncounterCheck = window.EncounterManager.checkEncounter;
      window.EncounterManager.checkEncounter = () => {}; // 無効化
    }

    this.setupFloor();
    this.renderBattle();

    showToast({ emoji: '🗼', title: 'タワー挑戦開始', message: '最上階を目指せ！' });
  },

  setupFloor() {
    // 敵HP: 100 + (階層 * 15)
    const hp = 100 + (this.state.currentFloor * 15);
    this.state.enemy.maxHp = hp;
    this.state.enemy.currentHp = hp;

    // 名前と絵文字を少しランダム化
    const enemies = [
      { name: 'Tower Slime', emoji: '💧' },
      { name: 'Tower Bat', emoji: '🦇' },
      { name: 'Tower Ghost', emoji: '👻' },
      { name: 'Tower Golem', emoji: '🗿' },
      { name: 'Tower Dragon', emoji: '🐉' }
    ];
    const index = Math.min(Math.floor((this.state.currentFloor - 1) / 5), enemies.length - 1);
    const template = enemies[index];

    this.state.enemy.name = `${template.name} Lv.${this.state.currentFloor}`;
    this.state.enemy.emoji = template.emoji;
  },

  damage(amount) {
    if (!this.state.isActive) return;

    this.state.enemy.currentHp = Math.max(0, this.state.enemy.currentHp - amount);

    // 即座に再描画
    this.renderBattle();

    // アバターへの視覚効果
    if (this.elements.enemyAvatar) {
      this.elements.enemyAvatar.classList.remove('boss-shake');
      void this.elements.enemyAvatar.offsetWidth;
      this.elements.enemyAvatar.classList.add('boss-shake');
    }
  },

  onSetFinished() {
    if (!this.state.isActive) return;

    // 1. 被ダメージ計算
    // ダメージ = Floor( (現在HP / 最大HP) * 20 )
    const ratio = this.state.enemy.currentHp / this.state.enemy.maxHp;
    const damage = Math.floor(ratio * 20);

    if (damage > 0) {
      this.state.playerHp = Math.max(0, this.state.playerHp - damage);
      showToast({ emoji: '💥', title: '被ダメージ！', message: `HP -${damage} (残り${this.state.playerHp})`, type: 'danger' });
    } else {
      showToast({ emoji: '🛡️', title: 'ノーダメージ！', message: '敵を完全に制圧した！' });
    }

    // 2. ゲームオーバー判定
    if (this.state.playerHp <= 0) {
      this.endTower(false); // ゲームオーバー
      // ワークアウト終了処理をトリガー
      if (typeof window.finishWorkout === 'function') {
        window.finishWorkout();
      }
      return;
    }

    // 3. 回復 & 次の階層へ
    const recovery = 10;
    const oldHp = this.state.playerHp;
    this.state.playerHp = Math.min(this.state.maxPlayerHp, this.state.playerHp + recovery);
    const healed = this.state.playerHp - oldHp;

    if (healed > 0) {
       setTimeout(() => {
         showToast({ emoji: '💖', title: '回復', message: `HP +${healed}` });
       }, 500);
    }

    this.state.currentFloor++;
    this.setupFloor();
    this.renderBattle();

    // 次の階層へのトースト通知
    setTimeout(() => {
      showToast({ emoji: '🆙', title: '階層突破！', message: `Floor ${this.state.currentFloor} へ進みます` });
    }, 1000);
  },

  endTower(isClear) {
    this.state.isActive = false;

    // UIを元に戻す
    if (this.elements.bossCard) this.elements.bossCard.style.display = 'block';
    if (this.elements.entryCard) this.elements.entryCard.style.display = 'block';
    if (this.elements.battleCard) this.elements.battleCard.style.display = 'none';

    // 設定を元に戻す
    const setCountInput = document.getElementById('set-count');
    if (setCountInput && this._originalSetCount) {
       setCountInput.value = this._originalSetCount;
       setCountInput.dispatchEvent(new Event('change'));
    }

    // ランダムイベント（Encounter）を元に戻す
    if (window.EncounterManager && this._originalEncounterCheck) {
      window.EncounterManager.checkEncounter = this._originalEncounterCheck;
    }

    // スコア保存
    const isNewRecord = this.saveHighScore();

    // 結果メッセージ
    const emoji = isNewRecord ? '👑' : '💀';
    const title = isNewRecord ? 'NEW RECORD!' : 'GAME OVER';
    const msg = `到達階層: ${this.state.currentFloor}F`;

    showToast({ emoji, title, message: msg });

    this.renderEntry();
  },

  renderEntry() {
    if (this.elements.highScore) {
      this.elements.highScore.textContent = `${this.state.highScore}F`;
    }
  },

  renderBattle() {
    if (this.elements.floorDisplay) {
      this.elements.floorDisplay.textContent = `Floor ${this.state.currentFloor}`;
    }

    if (this.elements.playerHpText) {
      this.elements.playerHpText.textContent = `${this.state.playerHp}/${this.state.maxPlayerHp}`;
    }

    if (this.elements.playerHpBar) {
      const pct = (this.state.playerHp / this.state.maxPlayerHp) * 100;
      this.elements.playerHpBar.style.width = `${pct}%`;

      // カラークラスの適用
      this.elements.playerHpBar.className = 'progress-bar tower-hp-bar'; // reset
      if (pct <= 20) this.elements.playerHpBar.classList.add('danger');
      else if (pct <= 50) this.elements.playerHpBar.classList.add('warning');
    }

    if (this.elements.enemyName) {
      this.elements.enemyName.textContent = this.state.enemy.name;
    }

    if (this.elements.enemyAvatar) {
      this.elements.enemyAvatar.textContent = this.state.enemy.emoji;
    }

    if (this.elements.enemyHpText) {
      const current = Math.ceil(this.state.enemy.currentHp);
      const max = Math.ceil(this.state.enemy.maxHp);
      this.elements.enemyHpText.textContent = `${current} / ${max}`;
    }

    if (this.elements.enemyHpBar) {
      const pct = (this.state.enemy.currentHp / this.state.enemy.maxHp) * 100;
      this.elements.enemyHpBar.style.width = `${pct}%`;
    }
  }
};
