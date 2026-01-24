export class AudioManager {
  constructor() {
    this.audio = document.getElementById('album-audio');
    this.progressBar = null;
    this.progressBarContainer = null;
    this.currentTimeDisplay = null;
    this.totalTimeDisplay = null;
    this.isDragging = false;
    
    if (this.audio) {
      // Try to get elements immediately if available
      const player = document.querySelector('.custom-player');
      if (player) {
        this.progressBar = player.querySelector('.progress-fill');
        this.progressBarContainer = player.querySelector('.progress-bar');
        this.currentTimeDisplay = player.querySelector('.current-time');
        this.totalTimeDisplay = player.querySelector('.total-time');
      }
      
      // Update total time when metadata is loaded
      this.audio.addEventListener('loadedmetadata', () => {
        this.updateTotalTime();
      });
      
      // Also try to update if duration is already available
      if (this.audio.readyState >= 1 && this.audio.duration) {
        setTimeout(() => this.updateTotalTime(), 100);
      }
      
      this.audio.addEventListener('ended', () => this.handleAudioEnded());
      this.initProgressBar();
    }
  }
  
  initProgressBar() {
    // Find progress bar container if not already set
    if (!this.progressBarContainer) {
      this.progressBarContainer = document.querySelector('.progress-bar');
    }
    
    if (this.progressBarContainer && !this.progressBarContainer.hasAttribute('data-initialized')) {
      this.progressBarContainer.setAttribute('data-initialized', 'true');
      
      // Mouse events
      this.progressBarContainer.addEventListener('click', (e) => this.handleProgressClick(e));
      this.progressBarContainer.addEventListener('mousedown', (e) => {
        this.isDragging = true;
        this.handleProgressClick(e);
      });
      
      // Touch events
      this.progressBarContainer.addEventListener('touchstart', (e) => {
        this.isDragging = true;
        this.handleProgressClick(e);
      }, { passive: false });
      
      // Update while dragging
      this.progressBarContainer.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
          this.handleProgressClick(e);
        }
      });
      this.progressBarContainer.addEventListener('touchmove', (e) => {
        if (this.isDragging) {
          e.preventDefault();
          this.handleProgressClick(e);
        }
      }, { passive: false });
    }
    
    // Stop dragging on mouse/touch up (only add once)
    if (!window.__audioManagerDragHandlers) {
      window.__audioManagerDragHandlers = true;
      document.addEventListener('mouseup', () => {
        this.isDragging = false;
      });
      document.addEventListener('touchend', () => {
        this.isDragging = false;
      });
    }
  }
  
  handleProgressClick(event) {
    if (!this.audio || !this.progressBarContainer || !this.audio.duration) return;
    
    const rect = this.progressBarContainer.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
    const clickX = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    
    this.audio.currentTime = percentage * this.audio.duration;
    
    // Update progress immediately
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage * 100}%`;
    }
    
    // Update time display
    const minutes = Math.floor(this.audio.currentTime / 60);
    const seconds = Math.floor(this.audio.currentTime % 60);
    if (this.currentTimeDisplay) {
      this.currentTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  togglePlayer(button) {
    if (!this.audio || !button) return;
    
    const playIcon = button.querySelector('.play-icon');
    const pauseIcon = button.querySelector('.pause-icon');
    
    // Get player elements
    const player = button.closest('.custom-player');
    if (player) {
      this.progressBar = player.querySelector('.progress-fill');
      this.progressBarContainer = player.querySelector('.progress-bar');
      this.currentTimeDisplay = player.querySelector('.current-time');
      this.totalTimeDisplay = player.querySelector('.total-time');
      
      // Initialize progress bar if not already done
      if (this.progressBarContainer) {
        this.initProgressBar();
      }
      
      // Update total time if available
      if (this.audio.duration && this.totalTimeDisplay) {
        this.updateTotalTime();
      }
    }
    
    if (this.audio.paused) {
      // Play the audio
      this.audio.play().then(() => {
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'inline';
        
        // Update progress bar
        this.updateProgress();
      }).catch(error => {
        console.error('Error playing audio:', error);
      });
    } else {
      // Pause the audio
      this.audio.pause();
      if (playIcon) playIcon.style.display = 'inline';
      if (pauseIcon) pauseIcon.style.display = 'none';
    }
  }
  
  updateTotalTime() {
    if (!this.audio || !this.totalTimeDisplay) return;
    
    const minutes = Math.floor(this.audio.duration / 60);
    const seconds = Math.floor(this.audio.duration % 60);
    this.totalTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  updateProgress() {
    if (!this.audio || this.audio.paused || !this.progressBar || !this.currentTimeDisplay) return;
    
    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    this.progressBar.style.width = `${progress}%`;
    
    // Update time display
    const minutes = Math.floor(this.audio.currentTime / 60);
    const seconds = Math.floor(this.audio.currentTime % 60);
    this.currentTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (!this.audio.paused) {
      requestAnimationFrame(() => this.updateProgress());
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
  }
}
