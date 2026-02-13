import { isStorageAvailable } from '../utils.js';

const PLAYLIST_KEY = 'squat-tracker-playlists';

export const PlaylistManager = {
  playlists: [],
  elements: {},

  init(domElements) {
    // domElements: { playlistSelect }
    this.elements = domElements;
    this.loadPlaylists();
    this.renderOptions();
  },

  loadPlaylists() {
    if (!isStorageAvailable) return;
    try {
      const stored = localStorage.getItem(PLAYLIST_KEY);
      if (stored) {
        this.playlists = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load playlists', e);
      this.playlists = [];
    }
  },

  savePlaylists() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(PLAYLIST_KEY, JSON.stringify(this.playlists));
    } catch (e) {
      console.error('Failed to save playlists', e);
    }
  },

  createPlaylist(name, items) {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newPlaylist = {
      id,
      name,
      items: JSON.parse(JSON.stringify(items)), // Deep copy
      createdAt: new Date().toISOString()
    };
    this.playlists.push(newPlaylist);
    this.savePlaylists();
    this.renderOptions();
    return newPlaylist;
  },

  updatePlaylist(id, name, items) {
    const index = this.playlists.findIndex(p => p.id === id);
    if (index !== -1) {
      this.playlists[index] = {
        ...this.playlists[index],
        name,
        items: JSON.parse(JSON.stringify(items)),
        updatedAt: new Date().toISOString()
      };
      this.savePlaylists();
      this.renderOptions();
      return true;
    }
    return false;
  },

  deletePlaylist(id) {
    this.playlists = this.playlists.filter(p => p.id !== id);
    this.savePlaylists();
    this.renderOptions();
  },

  getPlaylist(id) {
    return this.playlists.find(p => p.id === id);
  },

  getAllPlaylists() {
    return [...this.playlists];
  },

  renderOptions(selectedId = null) {
    const { playlistSelect } = this.elements;
    if (!playlistSelect) return;

    playlistSelect.innerHTML = '<option value="">-- プレイリストを選択 --</option>';

    this.playlists.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `🎵 ${p.name} (${p.items.length}セッション)`;
      playlistSelect.appendChild(option);
    });

    if (selectedId) {
      playlistSelect.value = selectedId;
    }
  }
};
