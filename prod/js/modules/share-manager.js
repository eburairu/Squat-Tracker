import { InventoryManager } from './inventory-manager.js';
import { TitleManager } from './title-manager.js';
import { RpgSystem } from './rpg-system.js';
import { showToast } from '../utils.js';

export const ShareManager = {
    modalEl: null,
    boundAdjustScale: null,

    init() {
        // Context binding
        this.boundAdjustScale = this.adjustScale.bind(this);
        this.loadLibrary();
    },

    loadLibrary() {
        if (typeof window !== 'undefined' && !window.html2canvas) {
            const script = document.createElement('script');
            script.src = 'js/vendor/html2canvas.min.js';
            document.head.appendChild(script);
        }
    },

    createModal() {
        if (document.getElementById('share-modal')) return;

        const html = `
        <div id="share-modal" class="modal" aria-hidden="true" style="display: none;">
            <div class="modal-overlay"></div>
            <div class="modal-content share-modal-content">
                <div class="modal-header">
                    <h2>戦績シェア</h2>
                    <button class="close-btn" aria-label="閉じる">&times;</button>
                </div>

                <div class="share-preview-wrapper">
                    <div id="share-card-target" class="share-card">
                        <!-- Content injected dynamically -->
                    </div>
                </div>

                <div class="modal-footer">
                    <p class="share-note">※画像として保存されます</p>
                    <button id="share-download-btn" class="btn primary">画像を保存</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        this.modalEl = document.getElementById('share-modal');

        // Event Listeners
        this.modalEl.querySelector('.close-btn').addEventListener('click', () => this.close());
        this.modalEl.querySelector('.modal-overlay').addEventListener('click', () => this.close());
        document.getElementById('share-download-btn').addEventListener('click', () => this.generateAndDownload());
    },

    open(resultData) {
        if (!this.modalEl) this.createModal();

        this.renderCard(resultData);
        this.modalEl.style.display = 'flex';
        this.modalEl.setAttribute('aria-hidden', 'false');

        // Adjust scale
        this.adjustScale();
        window.addEventListener('resize', this.boundAdjustScale);
    },

    close() {
        if (!this.modalEl) return;
        this.modalEl.style.display = 'none';
        this.modalEl.setAttribute('aria-hidden', 'true');
        window.removeEventListener('resize', this.boundAdjustScale);
    },

    adjustScale() {
        const wrapper = this.modalEl.querySelector('.share-preview-wrapper');
        const card = document.getElementById('share-card-target');
        if (!wrapper || !card) return;

        const wrapperWidth = wrapper.clientWidth;
        // Card fixed width defined in CSS (600px)
        const cardWidth = 600;

        let scale = 1;
        // Shrink if wrapper is smaller than card
        if (wrapperWidth < cardWidth) {
            scale = (wrapperWidth - 32) / cardWidth; // 32px buffer
        }

        card.style.transform = `scale(${scale})`;
        card.style.transformOrigin = 'top center';

        // Adjust wrapper height to fit scaled card
        wrapper.style.height = `${card.offsetHeight * scale + 20}px`;
    },

    renderCard(data) {
        const card = document.getElementById('share-card-target');
        const date = new Date().toLocaleDateString('ja-JP');

        // Get RPG Data
        const currentWeapon = InventoryManager.getEquippedWeapon();
        const currentTitle = TitleManager.getFullTitle();

        // Fallback for monster
        const monster = RpgSystem.monster || { name: '謎のモンスター', emoji: '❓' };

        const html = `
            <div class="sc-header">
                <span class="sc-app-name">SQUAT QUEST</span>
                <span class="sc-date">${date}</span>
            </div>

            <div class="sc-hero">
                <div class="sc-boss-emoji">${monster.emoji}</div>
                <div class="sc-vs">Vs. ${monster.name}</div>
            </div>

            <div class="sc-stats-grid">
                <div class="sc-stat">
                    <span class="sc-stat-label">TOTAL REPS</span>
                    <span class="sc-stat-value">${data.totalReps || 0}</span>
                </div>
                <div class="sc-stat">
                    <span class="sc-stat-label">CALORIES</span>
                    <span class="sc-stat-value">${data.totalCalories || 0} kcal</span>
                </div>
            </div>

            <div class="sc-equipment">
                <div class="sc-item">
                    <div class="sc-icon">${currentWeapon.emoji}</div>
                    <div class="sc-info">
                        <div class="sc-label">WEAPON</div>
                        <div class="sc-name">${currentWeapon.name}</div>
                    </div>
                </div>
                <div class="sc-item">
                    <div class="sc-icon">👑</div>
                    <div class="sc-info">
                        <div class="sc-label">TITLE</div>
                        <div class="sc-name">${currentTitle}</div>
                    </div>
                </div>
            </div>

            <div class="sc-footer">
                Squat Tracker by @eburairu
            </div>
        `;

        card.innerHTML = html;
    },

    async generateAndDownload() {
        if (typeof html2canvas === 'undefined') {
            showToast({ emoji: '⚠️', title: 'エラー', message: '画像生成ライブラリが読み込まれていません。' });
            return;
        }

        const btn = document.getElementById('share-download-btn');
        const originalText = btn.textContent;
        btn.textContent = '生成中...';
        btn.disabled = true;

        try {
            const card = document.getElementById('share-card-target');

            const canvas = await html2canvas(card, {
                scale: 2, // Retina resolution
                backgroundColor: '#2a2a40', // Fallback background color matching CSS
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedCard = clonedDoc.getElementById('share-card-target');
                    if (clonedCard) {
                        clonedCard.style.transform = 'none'; // Reset scale for full res capture
                        clonedCard.style.margin = '0';
                    }
                }
            });

            // Trigger Download
            const link = document.createElement('a');
            link.download = `squat-quest-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            showToast({ emoji: '📸', title: '保存完了', message: '画像を保存しました！' });

        } catch (e) {
            console.error(e);
            showToast({ emoji: '❌', title: 'エラー', message: '画像の生成に失敗しました。' });
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};
