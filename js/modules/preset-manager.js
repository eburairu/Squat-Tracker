import { isStorageAvailable } from '../utils.js';

const PRESET_KEY = 'squat-tracker-presets';

export const PresetManager = {
  presets: [],

  init(domElements) {
    // domElements: { presetSelect, savePresetButton, deletePresetButton, inputs... }
    this.elements = domElements;
    this.loadPresets();
    if (this.presets.length === 0) {
      this.createDefaultPresets();
    }
    this.renderOptions();
    this.updateButtons();
  },

  loadPresets() {
    if (!isStorageAvailable) return;
    try {
      const stored = localStorage.getItem(PRESET_KEY);
      if (stored) {
        this.presets = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load presets', e);
    }
  },

  savePresets() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(this.presets));
    } catch (e) {
      console.error('Failed to save presets', e);
    }
  },

  createDefaultPresets() {
    this.presets = [
      {
        name: 'ノーマル (標準)',
        settings: { setCount: 3, repCount: 10, downDuration: 2, holdDuration: 1, upDuration: 1, restDuration: 30, countdownDuration: 5 }
      },
      {
        name: '初心者 (軽め)',
        settings: { setCount: 2, repCount: 5, downDuration: 2, holdDuration: 1, upDuration: 1, restDuration: 60, countdownDuration: 5 }
      },
      {
        name: 'スロー (じっくり)',
        settings: { setCount: 3, repCount: 8, downDuration: 4, holdDuration: 2, upDuration: 4, restDuration: 45, countdownDuration: 5 }
      }
    ];
    this.savePresets();
  },

  addPreset(name, settings) {
    const existingIndex = this.presets.findIndex(p => p.name === name);
    if (existingIndex >= 0) {
      this.presets[existingIndex] = { name, settings };
    } else {
      this.presets.push({ name, settings });
    }
    this.savePresets();
    this.renderOptions(name);
  },

  deletePreset(name) {
    this.presets = this.presets.filter(p => p.name !== name);
    this.savePresets();
    this.renderOptions('');
  },

  getPreset(name) {
    return this.presets.find(p => p.name === name);
  },

  renderOptions(selectedName = null) {
    const { presetSelect } = this.elements;
    if (!presetSelect) return;
    const currentVal = selectedName !== null ? selectedName : presetSelect.value;
    presetSelect.innerHTML = '<option value="">-- 選択してください --</option>';
    this.presets.forEach(p => {
      const option = document.createElement('option');
      option.value = p.name;
      option.textContent = p.name;
      presetSelect.appendChild(option);
    });

    if (selectedName !== null) {
         presetSelect.value = selectedName;
    } else if (currentVal && this.presets.some(p => p.name === currentVal)) {
         presetSelect.value = currentVal;
    }

    this.updateButtons();
  },

  updateButtons() {
    const { deletePresetButton, presetSelect } = this.elements;
    if (deletePresetButton) {
        deletePresetButton.disabled = !presetSelect.value;
    }
  }
};
