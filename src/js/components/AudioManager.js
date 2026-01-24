export class AudioManager {
  constructor() {
    this.audio = document.getElementById('album-audio');
    this.progressBar = null;
    this.currentTimeDisplay = null;
    this.totalTimeDisplay = null;
    
    if (this.audio) {
      this.audio.addEventListener('loadedmetadata', () => this.updateTotalTime());
      this.audio.addEventListener('ended', () => this.handleAudioEnded());
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
      this.currentTimeDisplay = player.querySelector('.current-time');
      this.totalTimeDisplay = player.querySelector('.total-time');
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
