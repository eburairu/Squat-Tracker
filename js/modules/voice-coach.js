import { loadJson } from './resource-loader.js';
import { STORAGE_KEYS } from '../constants.js';

export const VoiceCoach = {
  enabled: false,
  voice: null,
  currentPersonaId: 'default',
  personas: {},

  async init() {
    try {
      this.personas = await loadJson('js/data/personas.json');
    } catch (e) {
      console.error('Failed to load personas.json', e);
      this.personas = {
        default: {
          name: "Default",
          pitch: 1.0,
          rate: 1.0,
          lines: {}
        }
      };
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = ['Google', 'Haruka', 'Ichiro', 'Kyoko', 'Nanami'];

      this.voice = voices.find((v) => v.lang === 'ja-JP' && preferredVoices.some(name => v.name.includes(name)))
        || voices.find((v) => v.lang === 'ja-JP' && v.default)
        || voices.find((v) => v.lang === 'ja-JP')
        || voices[0]
        || null;

      // console.log('VoiceCoach selected voice:', this.voice ? this.voice.name : 'none');
    };

    setVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  },

  speak(text) {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!this.enabled || !synth) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    if (this.voice) {
      utterance.voice = this.voice;
    }

    const persona = this.personas[this.currentPersonaId] || this.personas['default'];
    utterance.rate = persona ? (persona.rate || 1.0) : 1.0;
    utterance.pitch = persona ? (persona.pitch || 1.0) : 1.0;
    utterance.volume = 1.0;

    synth.speak(utterance);
  },

  play(actionKey, defaultText) {
    const persona = this.personas[this.currentPersonaId] || this.personas['default'];
    let textToSpeak = defaultText;
    if (persona && persona.lines && persona.lines[actionKey]) {
      textToSpeak = persona.lines[actionKey];
    }
    this.speak(textToSpeak);
  },

  setPersona(id) {
    if (this.personas[id]) {
      this.currentPersonaId = id;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.VOICE_PERSONA, id);
      }
    }
  },

  setEnabled(value) {
    this.enabled = value;
  }
};
