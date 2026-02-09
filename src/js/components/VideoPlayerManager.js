import { createPlayIcon, createPauseIcon } from '../utils/SvgIcons.js';
import { isMobileDevice } from '../utils/MediaUtils.js';

export class VideoPlayerManager {
  constructor() {
    this.players = [];
    this.hlsInstances = new Map(); // Храним HLS-инстансы для каждого видео
    this.init();
  }

   init() {
     const wrappers = Array.from(document.querySelectorAll('[data-video-player]'));
     if (!wrappers.length) return;

     const isTouchDevice = isMobileDevice();

     wrappers.forEach((wrapper) => {
       const video = wrapper.querySelector('[data-video]');
       const seek = wrapper.querySelector('[data-video-seek]');
       const volume = wrapper.querySelector('[data-video-volume]');
       const toggle = wrapper.querySelector('[data-video-toggle]');
       const fullscreen = wrapper.querySelector('[data-video-fullscreen]');
       const centerToggle = wrapper.querySelector('.video-player__center-toggle');
       if (!video || !seek || !volume || !toggle || !fullscreen) return;

       wrapper.classList.toggle('is-touch', isTouchDevice);

       const player = {
         wrapper,
         video,
         seek,
         volume,
         toggle,
         fullscreen,
         centerToggle,
         isScrubbing: false,
         initialized: false,
         tempIcon: null,
         bufferBar: null,
         volumeFill: null
        };
        this.players.push(player);

        this.createTempIcon(player);
        this.createBufferIndicator(player);
        this.createVolumeIndicator(player);

        // Убираем автоматическую инициализацию - видео загружается только по клику на play
        // video.addEventListener('lazy-video-load', () => {
        //   this.initSource(player);
        // });

        // if (!video.dataset.lazyMedia) {
        //   this.initSource(player);
        // }

       // Клик на centerToggle запускает видео
       if (centerToggle) {
         centerToggle.addEventListener('click', (e) => {
           e.preventDefault();
           e.stopPropagation();
           // Если видео на паузе, запускаем
           if (video.paused) {
             if (!player.initialized) {
               this.showLoading(player);
               this.initSource(player);
               setTimeout(() => {
                 video.play().catch(() => {
                   this.hideLoading(player);
                 });
               }, 100);
             } else {
               video.play().catch(() => {});
             }
           } else {
             video.pause();
           }
         });
       }

       // Клик на wrapper запускает видео если не кликнули на кнопку
       wrapper.addEventListener('click', (e) => {
         // Игнорируем клики на контролы и центральную кнопку
         if (e.target.closest('.video-player__controls') || e.target.closest('.video-player__center-toggle')) {
           return;
         }

         // Если видео на паузе, запускаем
         if (video.paused) {
           if (!player.initialized) {
             this.showLoading(player);
             this.initSource(player);
             setTimeout(() => {
              video.play().catch(() => {
                this.hideLoading(player);
              });
            }, 100);
          } else {
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      });

       const swallowControlEvent = (event) => {
         event.stopPropagation();
       };

       const controlElements = [seek, volume];
       controlElements.forEach((control) => {
         ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach((eventName) => {
           control.addEventListener(eventName, swallowControlEvent);
         });
       });

       const seekWrapper = seek.closest('.video-player__seek-wrapper');
       const volumeWrapper = volume.closest('.video-player__volume-wrapper');
       [seekWrapper, volumeWrapper].forEach((controlWrapper) => {
         if (!controlWrapper) return;
         ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach((eventName) => {
           controlWrapper.addEventListener(eventName, swallowControlEvent);
         });
       });

       volume.addEventListener('input', () => {
         const value = Number(volume.value);
         video.volume = value;
         video.muted = value === 0;
         if (value > 0 && video.muted) {
           video.muted = false;
         }
         this.scheduleVolumeFill(player, value);
       });

      toggle.addEventListener('click', () => {
        // Если видео ещё не инициализировано, загружаем его
        if (!player.initialized) {
          this.initSource(player);
          // Небольшая задержка для загрузки, потом play
          setTimeout(() => {
            video.play().catch(() => {});
          }, 100);
        } else if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });

      seek.addEventListener('input', () => {
        player.isScrubbing = true;
        this.updateTimeFromSeek(player);
      });

      seek.addEventListener('change', () => {
        player.isScrubbing = false;
        this.updateTimeFromSeek(player);
      });

      video.addEventListener('loadedmetadata', () => {
        this.syncSeek(player);
        this.updateToggleState(player);
      });

      video.addEventListener('timeupdate', () => {
        if (!player.isScrubbing) {
          this.syncSeek(player);
        }
      });

       video.addEventListener('play', () => {
         if (!player.isScrubbing) {
           this.syncSeek(player);
         }
         this.updateToggleState(player);

         // Добавляем класс has-played при первом воспроизведении
         wrapper.classList.add('has-played');
         wrapper.classList.add('is-playing');

         // Показываем временную иконку play
         this.showTempIcon(player, true);
       });

        video.addEventListener('pause', () => {
          this.updateToggleState(player);
          this.showTempIcon(player, false);
          wrapper.classList.remove('is-playing');
        });

      // Обновляем прогресс буферизации
      video.addEventListener('progress', () => {
        this.updateBufferBar(player);
      });

      video.addEventListener('timeupdate', () => {
        if (!player.isScrubbing) {
          this.syncSeek(player);
          this.updateBufferBar(player);
        }
      });

      if (!video.muted) {
        volume.value = String(video.volume || 1);
      }

      wrapper.classList.toggle('is-playing', !video.paused);
     });
   }

  updateTimeFromSeek(player) {
    const { video, seek } = player;
    if (!video.duration || Number.isNaN(video.duration)) return;
    const percent = Number(seek.value) / 100;
    video.currentTime = percent * video.duration;
  }

  syncSeek(player) {
    const { video, seek } = player;
    if (!video.duration || Number.isNaN(video.duration)) return;
    const percent = (video.currentTime / video.duration) * 100;
    seek.value = String(Math.min(100, Math.max(0, percent)));
  }

  initSource(player) {
    const { video } = player;
    if (player.initialized) return;

    const hlsSrc = video.dataset.hlsSrc;

    // Проверяем, есть ли уже HLS-инстанс для этого видео
    if (this.hlsInstances.has(video)) {
      const existingHls = this.hlsInstances.get(video);
      if (existingHls) {
        try {
          existingHls.detachMedia();
          existingHls.destroy();
        } catch (e) {
          // Игнорируем ошибки при очистке
        }
        this.hlsInstances.delete(video);
      }
    }

    // Если есть HLS-источник и браузер поддерживает HLS
    if (hlsSrc && typeof Hls !== 'undefined') {
      if (Hls.isSupported()) {
        // Используем hls.js
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          debug: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxLoadingDelay: 4,
          maxBufferHole: 0.5
        });

        let errorRecoveryAttempts = 0;
        const maxRecoveryAttempts = 3;

        hls.loadSource(hlsSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.setupPosterCapture(video);
          // Убираем autoplay - пользователь сам нажмёт play
          // if (video.autoplay) {
          //   video.play().catch(() => {});
          // }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS media error, attempting recovery...');
                errorRecoveryAttempts++;

                if (errorRecoveryAttempts <= maxRecoveryAttempts) {
                  hls.recoverMediaError();
                } else {
                  console.warn('HLS recovery failed');
                }
                break;

              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS network error');
                break;

              default:
                console.warn('HLS fatal error:', data);
                break;
            }
          }
        });

        // Сохраняем инстанс для возможности очистки
        this.hlsInstances.set(video, hls);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Нативная поддержка HLS (Safari)
        video.src = hlsSrc;
        video.load();
        this.setupPosterCapture(video);
        // Убираем autoplay
        // if (video.autoplay) {
        //   video.play().catch(() => {});
        // }
      }
    }

    player.initialized = true;
  }

  updateToggleState(player) {
    if (!player.toggle) return;
    const isPaused = player.video.paused;

    const oldIcon = player.toggle.querySelector('.video-player__icon');
    if (oldIcon) {
      oldIcon.remove();
    }

    const newIcon = isPaused ? createPlayIcon() : createPauseIcon();
    player.toggle.appendChild(newIcon);
    player.toggle.dataset.currentIcon = isPaused ? 'play' : 'pause';
  }

  setupPosterCapture(video) {
    if (!video.dataset.posterAuto || video.poster) return;

    const capture = () => {
      if (video.dataset.posterCaptured) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        video.poster = dataUrl;
        video.dataset.posterCaptured = '1';
      } catch (error) {
        // Ignore capture failures (e.g., browser restrictions)
      }
    };

    if (video.readyState >= 2) {
      capture();
    } else {
      video.addEventListener('loadeddata', capture, { once: true });
    }
  }

  // Очистка HLS-инстансов при уничтожении
  destroy() {
    this.hlsInstances.forEach((hls, video) => {
      if (hls) {
        try {
          hls.detachMedia();
          hls.destroy();
        } catch (e) {
          console.warn('Error destroying HLS instance:', e);
        }
      }
    });
    this.hlsInstances.clear();
  }

  // Создание элемента для временных иконок
  createTempIcon(player) {
    const icon = document.createElement('div');
    icon.className = 'video-player__temp-icon';
    player.wrapper.appendChild(icon);
    player.tempIcon = icon;
  }

  // Создание индикатора буферизации на seek bar
  createBufferIndicator(player) {
    // Оборачиваем seek в контейнер если его ещё нет
    if (!player.seek.parentElement.classList.contains('video-player__seek-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'video-player__seek-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.flex = '1';
      wrapper.style.minWidth = '140px';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';

      player.seek.parentNode.insertBefore(wrapper, player.seek);
      wrapper.appendChild(player.seek);

      const bufferBar = document.createElement('div');
      bufferBar.className = 'video-player__seek-buffer';
      wrapper.appendChild(bufferBar);
      player.bufferBar = bufferBar;
    }
  }

  // Создание индикатора уровня громкости
  createVolumeIndicator(player) {
    // Оборачиваем volume в контейнер если его ещё нет
    if (!player.volume.parentElement.classList.contains('video-player__volume-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'video-player__volume-wrapper';

      player.volume.parentNode.insertBefore(wrapper, player.volume);
      wrapper.appendChild(player.volume);

      const volumeFill = document.createElement('div');
      volumeFill.className = 'video-player__volume-fill';
      wrapper.appendChild(volumeFill);
      player.volumeFill = volumeFill;

      // Инициализируем начальное значение
      this.updateVolumeFill(player);
    }
  }

  // Показать индикатор загрузки
  showLoading(player) {
    if (player.loadingIndicator && player.initialized) {
      player.loadingIndicator.classList.add('is-visible');
    }
  }

  // Скрыть индикатор загрузки
  hideLoading(player) {
    if (player.loadingIndicator) {
      player.loadingIndicator.classList.remove('is-visible');
    }
  }

  // Показать временную иконку play/pause
  showTempIcon(player, isPlaying) {
    if (!player.tempIcon) return;

    player.tempIcon.style.animation = 'none';
    player.tempIcon.offsetHeight;

    player.tempIcon.innerHTML = '';
    const icon = isPlaying ? createPlayIcon() : createPauseIcon();
    player.tempIcon.appendChild(icon);

    player.tempIcon.style.animation = 'tempIconFade 0.6s ease-out';
  }

  // Обновление визуального индикатора буферизации на seek bar
  updateBufferBar(player) {
    const { video, bufferBar } = player;
    if (!bufferBar || !video.buffered.length || !video.duration) return;
    
    try {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const duration = video.duration;
      const percent = (bufferedEnd / duration) * 100;
      
      bufferBar.style.width = `${Math.min(100, percent)}%`;
    } catch (e) {
      // Игнорируем ошибки при обновлении буфера
    }
  }
  
  // Запланировать обновление индикатора громкости
  scheduleVolumeFill(player, value) {
    if (Number.isNaN(value)) return;
    player.pendingVolumeValue = value;
    if (player.volumeRaf) return;
    player.volumeRaf = requestAnimationFrame(() => {
      player.volumeRaf = null;
      this.updateVolumeFill(player, player.pendingVolumeValue);
    });
  }

  // Обновление визуального индикатора уровня громкости
  updateVolumeFill(player, valueOverride = null) {
    const { volume, volumeFill } = player;
    if (!volumeFill) return;

    const rawValue = valueOverride === null ? Number(volume.value) : valueOverride;
    const value = Math.min(1, Math.max(0, rawValue));
    const percent = value * 100;

    volumeFill.style.width = `${percent}%`;
  }
}
