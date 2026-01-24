import { isStorageAvailable, showToast } from '../utils.js';

const TITLES_KEY = 'squat-tracker-titles';

export const TitleManager = {
  data: { prefixes: [], suffixes: [] },
  state: {
    unlockedPrefixes: [],
    unlockedSuffixes: [],
    currentPrefix: null,
    currentSuffix: null
  },

  // UI callbacks or references could be stored here
  uiCallback: null,

  init(titlesData) {
    if (titlesData) {
      this.data = titlesData;
    }
    this.load();
    // Ensure initial data integrity (e.g. if default titles should be unlocked)
    this.ensureDefaults();
    this.setupUI();
    this.updateDisplay();
  },

  setupUI() {
    const openBtn = document.getElementById('open-title-settings');
    const modal = document.getElementById('title-modal');
    const closeBtns = document.querySelectorAll('#title-modal [data-close]');
    const saveBtn = document.getElementById('save-title-button');
    const prefixSelect = document.getElementById('prefix-select');
    const suffixSelect = document.getElementById('suffix-select');

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openSettingsModal());
    }

    if (modal) {
      closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          modal.setAttribute('aria-hidden', 'true');
          modal.classList.remove('active');
        });
      });

      modal.addEventListener('click', (e) => {
          if (e.target === modal) {
              modal.setAttribute('aria-hidden', 'true');
              modal.classList.remove('active');
          }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const pId = prefixSelect.value || null;
        const sId = suffixSelect.value || null;
        this.equip(pId, sId);
        this.updateDisplay();
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('active');
        }
        showToast({ emoji: '🏷️', title: '変更しました', message: '称号を更新しました。' });
      });
    }

    if (prefixSelect && suffixSelect) {
        const updatePreview = () => {
            this.updatePreview(prefixSelect.value, suffixSelect.value);
        };
        prefixSelect.addEventListener('change', updatePreview);
        suffixSelect.addEventListener('change', updatePreview);
    }
  },

  updateDisplay() {
    const el = document.getElementById('user-title-display');
    if (el) {
      el.textContent = this.getFullTitle();
    }
  },

  openSettingsModal() {
    const modal = document.getElementById('title-modal');
    if (!modal) return;

    this.populateSelect('prefix-select', this.data.prefixes, this.state.unlockedPrefixes, this.state.currentPrefix);
    this.populateSelect('suffix-select', this.data.suffixes, this.state.unlockedSuffixes, this.state.currentSuffix);

    this.updatePreview(this.state.currentPrefix, this.state.currentSuffix);

    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
  },

  populateSelect(elementId, items, unlockedIds, currentId) {
    const select = document.getElementById(elementId);
    if (!select) return;

    select.innerHTML = '';

    // Default option (No selection)
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '----';
    select.appendChild(defaultOpt);

    items.forEach(item => {
      const isUnlocked = unlockedIds.includes(item.id);
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = isUnlocked ? item.text : '🔒 ？？？';
      opt.disabled = !isUnlocked;

      if (item.id === currentId) {
        opt.selected = true;
      }

      select.appendChild(opt);
    });
  },

  updatePreview(pId, sId) {
     const previewEl = document.getElementById('title-preview-text');
     if (!previewEl) return;

     const p = this.data.prefixes.find(x => x.id === pId);
     const s = this.data.suffixes.find(x => x.id === sId);

     const pText = p ? p.text : '';
     const sText = s ? s.text : '';

     previewEl.textContent = (pText || sText) ? `${pText}${sText}` : 'Squat Tracker';
  },

  ensureDefaults() {
    // If we want to unlock specific starter titles by default
    // For now, assume empty or unlocked by achievements.
    // However, we should probably ensure 'Squat Tracker' parts are available if we treat them as titles.
    // Let's assume default state is handled by getFullTitle returning fallback if null.
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(TITLES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with default state structure to avoid crashes on schema updates
        this.state = {
          unlockedPrefixes: Array.isArray(parsed.unlockedPrefixes) ? parsed.unlockedPrefixes : [],
          unlockedSuffixes: Array.isArray(parsed.unlockedSuffixes) ? parsed.unlockedSuffixes : [],
          currentPrefix: parsed.currentPrefix || null,
          currentSuffix: parsed.currentSuffix || null
        };
      }
    } catch (e) {
      console.error('Failed to load titles', e);
    }
  },

  save() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(TITLES_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save titles', e);
    }
  },

  unlock(prefixId, suffixId, silent = false) {
    let newItemUnlocked = false;
    let unlockedName = '';

    if (prefixId) {
      const prefix = this.data.prefixes.find(p => p.id === prefixId);
      if (prefix && !this.state.unlockedPrefixes.includes(prefixId)) {
        this.state.unlockedPrefixes.push(prefixId);
        newItemUnlocked = true;
        unlockedName = `「${prefix.text}」`;
      }
    }

    if (suffixId) {
      const suffix = this.data.suffixes.find(s => s.id === suffixId);
      if (suffix && !this.state.unlockedSuffixes.includes(suffixId)) {
        this.state.unlockedSuffixes.push(suffixId);
        newItemUnlocked = true;
        const sName = `「${suffix.text}」`;
        unlockedName = unlockedName ? `${unlockedName} と ${sName}` : sName;
      }
    }

    if (newItemUnlocked) {
      this.save();

      if (!silent) {
        // Notify user
        showToast({
            emoji: '📛',
            title: '称号獲得！',
            message: `${unlockedName} を獲得しました！`,
            sound: true
        });
      }

      // Update UI if callback provided (for modal list etc)
      if (this.uiCallback) this.uiCallback();
    }
  },

  equip(prefixId, suffixId) {
    // Verify ownership
    const hasPrefix = !prefixId || this.state.unlockedPrefixes.includes(prefixId);
    const hasSuffix = !suffixId || this.state.unlockedSuffixes.includes(suffixId);

    if (hasPrefix && hasSuffix) {
      this.state.currentPrefix = prefixId;
      this.state.currentSuffix = suffixId;
      this.save();
      return true;
    }
    return false;
  },

  getFullTitle() {
    const pId = this.state.currentPrefix;
    const sId = this.state.currentSuffix;

    const prefixObj = pId ? this.data.prefixes.find(p => p.id === pId) : null;
    const suffixObj = sId ? this.data.suffixes.find(s => s.id === sId) : null;

    const prefixText = prefixObj ? prefixObj.text : '';
    const suffixText = suffixObj ? suffixObj.text : '';

    if (!prefixText && !suffixText) {
      return 'Squat Tracker'; // Default
    }

    return `${prefixText}${suffixText}`;
  },

  getAvailableTitles() {
    return {
      prefixes: this.data.prefixes.map(p => ({
        ...p,
        isUnlocked: this.state.unlockedPrefixes.includes(p.id)
      })),
      suffixes: this.data.suffixes.map(s => ({
        ...s,
        isUnlocked: this.state.unlockedSuffixes.includes(s.id)
      }))
    };
  }
};
