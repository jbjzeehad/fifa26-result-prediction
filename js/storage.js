/* ===========================================================
   storage.js
   Handles all LocalStorage persistence, JSON export & import
   =========================================================== */

const STORAGE_KEY = "wc2026_predictor_state_v1";

const Storage = {
  /**
   * Load saved state from LocalStorage.
   * @returns {Object|null} parsed state or null if not found/invalid
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load saved predictions:", e);
      return null;
    }
  },

  /**
   * Save the current state to LocalStorage.
   * @param {Object} state
   */
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save predictions:", e);
    }
  },

  /**
   * Clear all saved predictions.
   */
  reset() {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Trigger a download of the current state as a JSON file.
   * @param {Object} state
   */
  exportJSON(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wc2026_predictions.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Read a JSON file selected by the user and return the parsed object
   * via callback(data, error).
   * @param {File} file
   * @param {Function} callback
   */
  importJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        callback(data, null);
      } catch (err) {
        callback(null, err);
      }
    };
    reader.onerror = (err) => callback(null, err);
    reader.readAsText(file);
  },
};
