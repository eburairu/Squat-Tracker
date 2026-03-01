import { STORAGE_KEYS } from '../constants.js';
import { isStorageAvailable } from '../utils.js';




export const ThemeManager = {
  mode: 'light',
  style: 'default',
  elements: {
    toggle: null,
    status: null,
    styleRadios: []
  },

  init() {
    this.load();
    this.apply();
    this.setupUI();

    // Listen for system preference changes if no preference stored
    if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
                this.mode = e.matches ? 'dark' : 'light';
                this.apply();
                this.updateUI();
            }
        });
    }
  },

  load() {
    if (isStorageAvailable) {
      const storedMode = localStorage.getItem(STORAGE_KEYS.THEME);
      const storedStyle = localStorage.getItem(STORAGE_KEYS.THEME_STYLE);

      if (storedMode) {
        this.mode = storedMode;
      } else {
        // Default to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this.mode = 'dark';
        } else {
          this.mode = 'light';
        }
      }

      if (storedStyle) {
        this.style = storedStyle;
      }
    }
  },

  save() {
    if (isStorageAvailable) {
      localStorage.setItem(STORAGE_KEYS.THEME, this.mode);
      localStorage.setItem(STORAGE_KEYS.THEME_STYLE, this.style);
    }
  },

  apply() {
    document.body.setAttribute('data-theme', this.mode);
    if (this.style !== 'default') {
      document.body.setAttribute('data-style', this.style);
    } else {
      document.body.removeAttribute('data-style');
    }
    this.updateUI();
  },

  setMode(mode) {
    if (mode !== 'light' && mode !== 'dark') return;
    this.mode = mode;
    this.save();
    this.apply();
  },

  toggleMode() {
    this.setMode(this.mode === 'dark' ? 'light' : 'dark');
  },

  setStyle(style) {
    this.style = style;
    this.save();
    this.apply();
  },

  setupUI() {
    // Header Toggle
    this.elements.toggle = document.getElementById('theme-toggle');
    this.elements.status = document.getElementById('theme-status');

    if (this.elements.toggle) {
      this.elements.toggle.checked = this.mode === 'dark';
      this.elements.toggle.addEventListener('change', (e) => {
        this.setMode(e.target.checked ? 'dark' : 'light');
      });
    }

    // Settings Modal Radios (will be injected later, so use delegation or re-bind)
    // For now, we assume app.js will call a binding method after injecting HTML
  },

  bindSettingsUI() {
      const radios = document.querySelectorAll('input[name="theme-style"]');
      radios.forEach(radio => {
          if (radio.value === this.style) radio.checked = true;
          radio.addEventListener('change', (e) => {
              if (e.target.checked) {
                  this.setStyle(e.target.value);
              }
          });
      });
  },

  updateUI() {
    if (this.elements.toggle) {
      this.elements.toggle.checked = this.mode === 'dark';
    }
    if (this.elements.status) {
      this.elements.status.textContent = this.mode === 'dark' ? 'ダーク' : 'ライト';
    }

    // Update active state in settings if visible
    const radios = document.querySelectorAll('input[name="theme-style"]');
    radios.forEach(radio => {
        if (radio.value === this.style) radio.checked = true;
    });
  }
};
