import Amplitude from 'amplitudejs';

/**
 * AudioPlayerManager — аудиоплеер на базе Amplitude.js.
 * Интерфейс сохранён: constructor() + destroy().
 */
export class AudioPlayerManager {
  constructor() {
    this.root = document.querySelector('[data-audio-player]');
    if (!this.root) return;

    const audioSrc = this.root.dataset.audioSrc;
    const artworkSrc = this.root.dataset.artworkSrc || '';
    const trackTitle = this.root.dataset.trackTitle || '';
    const trackArtist = this.root.dataset.trackArtist || '';

    if (!audioSrc) return;

    // Инициализируем Amplitude
    Amplitude.init({
      songs: [
        {
          url: audioSrc,
          cover_art_url: artworkSrc,
          name: trackTitle,
          artist: trackArtist,
        }
      ],
      callbacks: {
        song_change: () => this._syncSlider(),
      }
    });

    // Синхронизируем CSS-класс is-playing с классами Amplitude
    this._playPauseBtn = this.root.querySelector('.amplitude-play-pause');
    this._observer = null;

    if (this._playPauseBtn) {
      this._observer = new MutationObserver(() => {
        const playing = this._playPauseBtn.classList.contains('amplitude-playing');
        this._playPauseBtn.classList.toggle('is-playing', playing);
      });
      this._observer.observe(this._playPauseBtn, { attributes: true, attributeFilter: ['class'] });
    }

    // Синхронизация прогресса: Amplitude обновляет range-слайдер,
    // но мы также обновляем <progress> если он есть
    this._progressEl = this.root.querySelector('[data-audio-progress]');
    this._currentEl  = this.root.querySelector('.amplitude-current-time');
    this._durationEl = this.root.querySelector('.amplitude-duration-time');

    // Amplitude не обновляет <input[range]> — слушаем timeupdate вручную
    if (this._progressEl) {
      this._isSeeking = false;

      // Обновляем ползунок по ходу воспроизведения
      this._onTimeUpdate = () => {
        if (this._isSeeking) return;
        const audio = Amplitude.getAudio();
        if (!audio) return;
        const dur = audio.duration || 0;
        this._progressEl.value = dur > 0 ? Math.round((audio.currentTime / dur) * 1000) : 0;
        this._updateRangeFill();
      };
      Amplitude.getAudio()?.addEventListener('timeupdate', this._onTimeUpdate);

      // Начало перетаскивания — фиксируем флаг
      this._onSeekStart = () => { this._isSeeking = true; };

      // Визуальное обновление во время перетаскивания
      this._onSeekInput = () => { this._updateRangeFill(); };

      // Конец перетаскивания — перематываем
      this._onSeekEnd = () => {
        const audio = Amplitude.getAudio();
        if (!audio) return;
        const dur = audio.duration || 0;
        const newTime = (this._progressEl.value / 1000) * dur;
        audio.currentTime = newTime;
        this._isSeeking = false;
      };

      this._progressEl.addEventListener('mousedown',  this._onSeekStart);
      this._progressEl.addEventListener('touchstart', this._onSeekStart, { passive: true });
      this._progressEl.addEventListener('input',  this._onSeekInput);
      this._progressEl.addEventListener('change', this._onSeekEnd);
    }
  }

  _updateRangeFill() {
    if (!this._progressEl) return;
    const pct = (this._progressEl.value / this._progressEl.max) * 100;
    this._progressEl.style.setProperty('--range-fill', `${pct}%`);
  }

  _syncSlider() {
    // При смене трека сбрасываем прогресс
    if (this._progressEl) {
      this._progressEl.value = 0;
      this._updateRangeFill();
    }
  }

  destroy() {
    this._observer?.disconnect();
    this._observer = null;

    if (this._onTimeUpdate) {
      Amplitude.getAudio()?.removeEventListener('timeupdate', this._onTimeUpdate);
      this._onTimeUpdate = null;
    }

    if (this._progressEl) {
      this._progressEl.removeEventListener('mousedown',  this._onSeekStart);
      this._progressEl.removeEventListener('touchstart', this._onSeekStart);
      this._progressEl.removeEventListener('input',  this._onSeekInput);
      this._progressEl.removeEventListener('change', this._onSeekEnd);
    }

    try {
      Amplitude.pause();
    } catch (_) {}
  }
}