export const GhostManager = {
  ghostData: null,
  element: null,
  container: null,
  isEnabled: false,
  totalDuration: 0,

  // Initialize with history entry or target pace
  init({ historyEntry, targetDuration, containerId = 'session-progress-bar', markerId = 'ghost-marker' }) {
    this.container = document.getElementById(containerId);

    // Create marker if not exists
    this.element = document.getElementById(markerId);
    if (!this.element && this.container) {
      this.element = document.createElement('div');
      this.element.id = markerId;
      this.element.className = 'ghost-marker';
      this.element.textContent = '👻';
      this.container.appendChild(this.element);
    }

    if (!historyEntry && !targetDuration) {
      this.isEnabled = false;
      if (this.element) this.element.style.display = 'none';
      return;
    }

    this.isEnabled = true;
    if (this.element) this.element.style.display = 'block';

    // Strategy: Replay Timeline or Linear Pace
    if (historyEntry && historyEntry.timeline && historyEntry.timeline.length > 0) {
      this.ghostData = {
        type: 'replay',
        timeline: historyEntry.timeline,
        totalDuration: historyEntry.timeline[historyEntry.timeline.length - 1]
      };
    } else {
      // Fallback: Linear Pace based on total duration
      const duration = targetDuration || (historyEntry ? historyEntry.totalReps * 3000 : 60000); // Default fallback
      this.ghostData = {
        type: 'linear',
        totalDuration: duration
      };
    }

    this.totalDuration = this.ghostData.totalDuration;
    this.update(0);
  },

  update(elapsedTime) {
    if (!this.isEnabled || !this.element || this.totalDuration <= 0) return;

    let progress = 0;

    if (this.ghostData.type === 'linear') {
      progress = Math.min(elapsedTime / this.totalDuration, 1.0);
    } else if (this.ghostData.type === 'replay') {
      // Find current step in timeline
      // Timeline stores completion time of each rep.
      // We want continuous movement?
      // Option A: Step movement (jump to next rep position when time reached)
      // Option B: Interpolated movement (smooth between reps)

      // Let's go with interpolated for "Pacemaker" feel.
      // Assuming rep 0 starts at 0.

      const timeline = this.ghostData.timeline;
      const totalReps = timeline.length;

      // Find which rep we are currently in
      let currentRepIndex = -1;
      let prevTime = 0;

      for (let i = 0; i < totalReps; i++) {
        if (elapsedTime < timeline[i]) {
          currentRepIndex = i;
          break;
        }
        prevTime = timeline[i];
      }

      if (currentRepIndex === -1) {
        // Finished
        progress = 1.0;
      } else {
        // Interpolate within the rep
        const nextTime = timeline[currentRepIndex];
        const duration = nextTime - prevTime;
        const repProgress = (elapsedTime - prevTime) / duration;

        // Overall progress: (Completed Reps + Current Rep Progress) / Total Reps
        progress = (currentRepIndex + repProgress) / totalReps;
      }
    }

    // Render
    this.element.style.left = `${progress * 100}%`;
  },

  reset() {
    this.isEnabled = false;
    if (this.element) {
      this.element.style.left = '0%';
      this.element.style.display = 'none';
    }
  },

  // Return ghost state for comparison
  getState(userProgress) {
    if (!this.isEnabled || !this.element) return null;
    // userProgress: 0.0 to 1.0
    // ghostProgress: we can calculate from current position style or store it
    const ghostLeft = parseFloat(this.element.style.left || '0');
    return {
      ghostProgress: ghostLeft / 100,
      diff: userProgress - (ghostLeft / 100)
    };
  }
};
