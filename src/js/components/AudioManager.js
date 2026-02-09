export class AudioManager {
  constructor() {
    this.audio = document.getElementById('album-audio');
    this.playerRoot = document.querySelector('.custom-player');
    this.progressBar = null;
    this.progressBarContainer = null;
    this.currentTimeDisplay = null;
    this.totalTimeDisplay = null;
    this.isDragging = false;
    this.progressRaf = null;
    this.isProgressInitialized = false;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.handleAudioEnded = this.handleAudioEnded.bind(this);

    if (this.audio) {
      this.cachePlayerElements();
      this.bindAudioEvents();
      this.initProgressBar();
      this.updateTotalTimeIfReady();
    }
  }

  cachePlayerElements() {
    if (!this.playerRoot) return;
    this.progressBar = this.playerRoot.querySelector('.progress-fill');
    this.progressBarContainer = this.playerRoot.querySelector('.progress-bar');
    this.currentTimeDisplay = this.playerRoot.querySelector('.current-time');
    this.totalTimeDisplay = this.playerRoot.querySelector('.total-time');
  }

  bindAudioEvents() {
    this.audio.addEventListener('loadedmetadata', () => this.updateTotalTime());
    this.audio.addEventListener('ended', this.handleAudioEnded);
    this.audio.addEventListener('play', () => this.startProgressLoop());
    this.audio.addEventListener('pause', () => this.stopProgressLoop());
  }

  updateTotalTimeIfReady() {
    if (this.audio.readyState >= 1 && this.audio.duration) {
      setTimeout(() => this.updateTotalTime(), 100);
    }
  }

  initProgressBar() {
    if (!this.progressBarContainer || this.isProgressInitialized) return;
    this.isProgressInitialized = true;

    this.progressBarContainer.addEventListener('pointerdown', this.handlePointerDown);
    this.progressBarContainer.addEventListener('pointermove', this.handlePointerMove);
    this.progressBarContainer.addEventListener('pointerup', this.handlePointerUp);
    this.progressBarContainer.addEventListener('pointercancel', this.handlePointerUp);
    this.progressBarContainer.addEventListener('pointerleave', this.handlePointerUp);
  }

  handlePointerDown(event) {
    if (!this.audio || !this.progressBarContainer || !this.audio.duration) return;
    this.isDragging = true;
    this.progressBarContainer.setPointerCapture(event.pointerId);
    this.seekToEvent(event);
    event.preventDefault();
  }

  handlePointerMove(event) {
    if (!this.isDragging) return;
    this.seekToEvent(event);
    event.preventDefault();
  }

  handlePointerUp(event) {
    if (!this.isDragging) return;
    this.isDragging = false;
    try {
      this.progressBarContainer.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Ignore if pointer capture is already released
    }
  }

  seekToEvent(event) {
    if (!this.audio || !this.progressBarContainer || !this.audio.duration) return;

    const rect = this.progressBarContainer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width || 1;
    const percentage = Math.max(0, Math.min(1, clickX / width));

    this.audio.currentTime = percentage * this.audio.duration;
    this.updateProgressUI(percentage);
  }

  togglePlayer(button) {
    if (!this.audio || !button) return;

    this.cachePlayerElements();
    this.initProgressBar();
    this.updateTotalTime();

    const playIcon = button.querySelector('.play-icon');
    const pauseIcon = button.querySelector('.pause-icon');

    if (this.audio.paused) {
      this.audio.play().then(() => {
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'inline';
      }).catch(error => {
        console.error('Error playing audio:', error);
      });
    } else {
      this.audio.pause();
      if (playIcon) playIcon.style.display = 'inline';
      if (pauseIcon) pauseIcon.style.display = 'none';
    }
  }

  updateTotalTime() {
    if (!this.audio || !this.totalTimeDisplay) return;
    if (!this.audio.duration || Number.isNaN(this.audio.duration)) return;

    const minutes = Math.floor(this.audio.duration / 60);
    const seconds = Math.floor(this.audio.duration % 60);
    this.totalTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  startProgressLoop() {
    if (this.progressRaf) return;
    this.updateProgress();
  }

  stopProgressLoop() {
    if (!this.progressRaf) return;
    cancelAnimationFrame(this.progressRaf);
    this.progressRaf = null;
  }

  updateProgress() {
    if (!this.audio || this.audio.paused) {
      this.stopProgressLoop();
      return;
    }

    if (!this.audio.duration || Number.isNaN(this.audio.duration)) {
      this.progressRaf = requestAnimationFrame(this.updateProgress);
      return;
    }

    const percentage = this.audio.currentTime / this.audio.duration;
    this.updateProgressUI(percentage);

    this.progressRaf = requestAnimationFrame(this.updateProgress);
  }

  updateProgressUI(percentage) {
    const clamped = Math.max(0, Math.min(1, percentage));

    if (this.progressBar) {
      this.progressBar.style.width = `${clamped * 100}%`;
    }

    if (this.currentTimeDisplay && this.audio) {
      const minutes = Math.floor(this.audio.currentTime / 60);
      const seconds = Math.floor(this.audio.currentTime % 60);
      this.currentTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  handleAudioEnded() {
    const playButtons = document.querySelectorAll('.play-pause-btn');
    playButtons.forEach(button => {
      const playIcon = button.querySelector('.play-icon');
      const pauseIcon = button.querySelector('.pause-icon');

      if (playIcon) playIcon.style.display = 'inline';
      if (pauseIcon) pauseIcon.style.display = 'none';
    });

    if (this.progressBar) this.progressBar.style.width = '0%';
    if (this.currentTimeDisplay) this.currentTimeDisplay.textContent = '0:00';
    this.stopProgressLoop();
  }
}
