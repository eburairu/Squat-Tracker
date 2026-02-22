export class SchedulerManager {
  static STORAGE_KEY = 'squat-tracker-weekly-schedule';

  static PLANS = {
    maintain: {
      label: '現状維持',
      description: '無理なく続けられる標準コース',
      settings: {
        setCount: 3,
        repCount: 10,
        downDuration: 2,
        holdDuration: 1,
        upDuration: 1,
        restDuration: 30,
        countdownDuration: 5
      }
    },
    improve: {
      label: '体力向上',
      description: '少し負荷を高めた成長コース',
      settings: {
        setCount: 3,
        repCount: 15,
        downDuration: 2,
        holdDuration: 1,
        upDuration: 1,
        restDuration: 30,
        countdownDuration: 5
      }
    },
    challenge: {
      label: '限界挑戦',
      description: '高負荷・スローテンポのハードコース',
      settings: {
        setCount: 4,
        repCount: 15,
        downDuration: 3,
        holdDuration: 2,
        upDuration: 1,
        restDuration: 45,
        countdownDuration: 5
      }
    }
  };

  /**
   * Save the weekly schedule to localStorage
   * @param {string} planType - 'maintain', 'improve', or 'challenge'
   * @param {number[]} days - Array of day indices (0-6, where 0 is Sunday)
   * @returns {boolean} Success status
   */
  static save(planType, days) {
    if (!this.PLANS[planType] || !Array.isArray(days) || days.length === 0) {
      return false;
    }

    const data = {
      updatedAt: new Date().toISOString(),
      planType,
      selectedDays: days,
      schedule: {}
    };

    // Store settings for each day (allows for future per-day customization)
    days.forEach(day => {
      data.schedule[day] = { ...this.PLANS[planType].settings };
    });

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save schedule:', e);
      return false;
    }
  }

  /**
   * Load the schedule from localStorage
   * @returns {object|null} The schedule data or null if not found/invalid
   */
  static load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);

      // Basic validation
      if (!data.planType || !Array.isArray(data.selectedDays)) {
        return null;
      }

      return data;
    } catch (e) {
      console.error('Failed to load schedule:', e);
      return null;
    }
  }

  /**
   * Check if there is a scheduled workout for today
   * @returns {object|null} The schedule info for today or null
   */
  static getTodaySchedule() {
    const data = this.load();
    if (!data) return null;

    const today = new Date().getDay(); // 0-6
    if (data.selectedDays.includes(today) && data.schedule[today]) {
      return {
        planType: data.planType,
        planLabel: this.PLANS[data.planType].label,
        settings: data.schedule[today]
      };
    }
    return null;
  }

  /**
   * Clear the schedule
   */
  static clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
