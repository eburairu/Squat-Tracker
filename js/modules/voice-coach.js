export const VoiceCoach = {
  enabled: false,
  voice: null,

  init() {
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
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    synth.speak(utterance);
  },

  setEnabled(value) {
    this.enabled = value;
  }
};
