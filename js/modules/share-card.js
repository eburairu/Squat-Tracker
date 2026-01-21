import { RpgSystem } from './rpg-system.js';
import { BossBattle } from './boss-battle.js';
import { InventoryManager } from './inventory-manager.js';
import { AchievementSystem } from './achievement-system.js';
import { computeStats } from '../utils.js';

export const ShareCard = {
  // ... existing init ...
  init() {
    this.injectButton();
    this.setupModal();
  },

  injectButton() {
    const tabAchievements = document.getElementById('tab-achievements');
    if (!tabAchievements) return;

    if (document.getElementById('create-share-card-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'create-share-card-btn';
    btn.className = 'primary';
    // Use innerHTML to add icon
    btn.innerHTML = '<span style="margin-right:0.5rem">📸</span> 戦績カードを作成';
    btn.style.width = '100%';
    btn.style.marginBottom = '1rem';
    btn.addEventListener('click', () => this.generate());

    const grid = document.getElementById('badge-grid');
    if (grid) {
      tabAchievements.insertBefore(btn, grid);
    } else {
      tabAchievements.appendChild(btn);
    }
  },

  setupModal() {
    const modal = document.getElementById('share-card-modal');
    if (!modal) return;

    modal.querySelectorAll('[data-close-share]').forEach(el => {
      el.addEventListener('click', () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      });
    });

    const downloadBtn = document.getElementById('share-card-download');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadImage());
    }
  },

  collectData() {
    // 1. Level & Stats
    // Assuming we can access global historyEntries if needed, or RpgSystem's internal state if exposed.
    // RpgSystem doesn't expose totalReps directly, but we can recalculate or fetch from stats.
    // However, app.js logic usually passes historyEntries to computeStats.
    // Since we are a module, we might need to rely on what RpgSystem exposes or fetch from localStorage if necessary.
    // But `computeStats` needs `historyEntries`. `app.js` has them.
    // We can fetch from localStorage 'squat-tracker-history-v1' as a fallback/primary source.

    let historyEntries = [];
    try {
      const raw = localStorage.getItem('squat-tracker-history-v1');
      if (raw) historyEntries = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    const stats = computeStats(historyEntries);
    const level = RpgSystem.calculateLevel(stats.totalRepsAllTime);
    const rank = RpgSystem.getRankTitle(level);
    const ap = RpgSystem.calculateAttackPower(level);

    // 2. Weapon
    const weapon = InventoryManager.getEquippedWeapon();

    // 3. Boss
    const bossKills = BossBattle.state ? BossBattle.state.totalKills : 0;

    // 4. Badges
    const unlockedBadges = Object.keys(AchievementSystem.unlocked).length;
    const totalBadges = AchievementSystem.badges.length;

    return {
      level,
      rank,
      ap,
      totalReps: stats.totalRepsAllTime,
      weapon: weapon || { name: '素手', rarity: 'common', emoji: '👊' },
      bossKills,
      badges: { unlocked: unlockedBadges, total: totalBadges },
      date: new Date().toLocaleDateString()
    };
  },

  async generate() {
    const data = this.collectData();
    const dataUrl = await this.drawCanvas(data);
    this.showModal(dataUrl);
  },

  drawCanvas(data) {
    // We'll create a canvas element in memory
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 400; // Aspect ratio 3:2

    canvas.width = width;
    canvas.height = height;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#3b82f6'; // Accent color
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SQUAT TRACKER BATTLE RECORD', width / 2, 50);

    // Date
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(data.date, width / 2, 75);

    // Left Column (Player Stats)
    ctx.textAlign = 'left';
    const leftX = 50;

    // Level & Rank
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Lv.' + data.level, leftX, 130);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(data.rank, leftX, 170);

    // AP
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Attack Power: ${data.ap}`, leftX, 200);

    // Reps
    ctx.fillText(`Total Reps: ${data.totalReps.toLocaleString()}`, leftX, 230);

    // Boss Kills
    ctx.fillText(`Boss Kills: ${data.bossKills}`, leftX, 260);

    // Badges
    ctx.fillText(`Badges: ${data.badges.unlocked} / ${data.badges.total}`, leftX, 290);

    // Right Column (Weapon & Visuals)
    const rightCenter = 450;

    // Weapon Display
    ctx.textAlign = 'center';

    // Weapon Emoji Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(rightCenter, 160, 60, 0, Math.PI * 2);
    ctx.fill();

    // Weapon Emoji
    ctx.font = '60px sans-serif';
    ctx.fillText(data.weapon.emoji, rightCenter, 180);

    // Weapon Name
    ctx.font = 'bold 18px sans-serif';
    let rarityColor = '#94a3b8'; // common
    if (data.weapon.rarity === 'rare') rarityColor = '#3b82f6';
    if (data.weapon.rarity === 'epic') rarityColor = '#a855f7';
    if (data.weapon.rarity === 'legendary') rarityColor = '#f59e0b';

    ctx.fillStyle = rarityColor;
    ctx.fillText(data.weapon.name, rightCenter, 240);

    // App URL / QR Placeholder
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('https://eburairu.github.io/Squat-Tracker/', width / 2, 370);

    return canvas.toDataURL('image/png');
  },

  showModal(dataUrl) {
    const modal = document.getElementById('share-card-modal');
    const img = document.getElementById('share-card-image');
    if (modal && img) {
      img.src = dataUrl;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
  },

  downloadImage() {
    const img = document.getElementById('share-card-image');
    if (!img || !img.src) return;

    const link = document.createElement('a');
    link.download = `squat-battle-record-${Date.now()}.png`;
    link.href = img.src;
    link.click();
  }
};
