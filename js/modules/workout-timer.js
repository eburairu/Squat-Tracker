export class WorkoutTimer {
  constructor() {
    this.timeoutId = null;
    this.callback = null;
    this.remaining = 0;
    this.startTime = 0;
    this.isRunning = false;
  }

  schedule(durationSeconds, callback) {
    this.cancel();
    this.callback = callback;
    this.remaining = durationSeconds * 1000;
    this.resume();
  }

  pause() {
    if (!this.isRunning) return;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = null;
    const elapsed = Date.now() - this.startTime;
    this.remaining = Math.max(0, this.remaining - elapsed);
    this.isRunning = false;
  }

  resume() {
    if (this.isRunning || !this.callback) return;
    // If remaining is 0 or less, execute immediately (or next tick)
    this.startTime = Date.now();
    this.isRunning = true;
    this.timeoutId = setTimeout(() => {
      this.isRunning = false;
      this.callback();
    }, Math.max(0, this.remaining));
  }

  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = null;
    this.callback = null;
    this.remaining = 0;
    this.isRunning = false;
  }
}
