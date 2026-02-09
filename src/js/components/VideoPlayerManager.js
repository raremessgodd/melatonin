import { createPlayIcon, createPauseIcon } from '../utils/SvgIcons.js';
import { isMobileDevice } from '../utils/MediaUtils.js';

const DEFAULT_VOLUME = 0.65; // 70% громкости по умолчанию

export class VideoPlayerManager {
  constructor() {
    this.players = [];
    this.hlsInstances = new Map();
    this.init();
  }

   init() {
     const wrappers = Array.from(document.querySelectorAll('[data-video-player]'));
     if (!wrappers.length) return;

     const isTouchDevice = isMobileDevice();

     wrappers.forEach((wrapper) => {
       const video = wrapper.querySelector('[data-video]');
       const seek = wrapper.querySelector('[data-video-seek]');
       const fullscreen = wrapper.querySelector('[data-video-fullscreen]');
       const centerToggle = wrapper.querySelector('.video-player__center-toggle');
       if (!video || !seek || !fullscreen) return;

       wrapper.classList.toggle('is-touch', isTouchDevice);
       video.volume = DEFAULT_VOLUME;
       video.muted = false; // Убедиться, что видео не muted

       const player = {
         wrapper,
         video,
         seek,
         fullscreen,
         centerToggle,
         isScrubbing: false,
         initialized: false,
         tempIcon: null,
         bufferBar: null,
         controlsHideTimeout: null
        };
        this.players.push(player);

        this.createTempIcon(player);
        this.createBufferIndicator(player);

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
           if (video.paused) {
             if (!player.initialized) {
               this.initSource(player);
               setTimeout(() => {
                 video.play().catch(() => {});
               }, 50);
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
         if (e.target.closest('.video-player__controls') || e.target.closest('.video-player__center-toggle')) {
           return;
         }

         // На мобилке: если контролы скрыты, показываем их вместо паузы
         if (isTouchDevice && wrapper.classList.contains('controls-hidden')) {
           clearTimeout(player.controlsHideTimeout);
           wrapper.classList.remove('controls-hidden');
           return;
         }

         if (video.paused) {
           if (!player.initialized) {
             this.initSource(player);
             setTimeout(() => {
              video.play().catch(() => {});
            }, 50);
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

      const seekWrapper = seek.closest('.video-player__seek-wrapper');
      if (seekWrapper) {
        ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach((eventName) => {
          seekWrapper.addEventListener(eventName, swallowControlEvent);
        });
      }
      seek.addEventListener('pointerdown', swallowControlEvent);
      seek.addEventListener('mousedown', swallowControlEvent);
      seek.addEventListener('touchstart', swallowControlEvent);
      seek.addEventListener('click', swallowControlEvent);

      // Добавляем визуальную обратную связь при взаимодействии
      const addActiveClass = () => {
        if (seekWrapper) seekWrapper.classList.add('is-seeking');
      };

      const removeActiveClass = () => {
        if (seekWrapper) seekWrapper.classList.remove('is-seeking');
      };

      seek.addEventListener('pointerdown', addActiveClass);
      seek.addEventListener('touchstart', addActiveClass);
      seek.addEventListener('mousedown', addActiveClass);

      seek.addEventListener('pointerup', removeActiveClass);
      seek.addEventListener('touchend', removeActiveClass);
      seek.addEventListener('mouseup', removeActiveClass);
      seek.addEventListener('pointercancel', removeActiveClass);
      seek.addEventListener('touchcancel', removeActiveClass);

      seek.addEventListener('input', () => {
        player.isScrubbing = true;
        this.updateTimeFromSeek(player);
      });

      seek.addEventListener('change', () => {
        player.isScrubbing = false;
        this.updateTimeFromSeek(player);
      });

      // Fullscreen обрабатывается в App.js - не добавляем обработчик здесь
      // Кнопка fullscreen открывает/закрывает ЛАЙТБОКС, а не браузерный fullscreen

      video.addEventListener('loadedmetadata', () => {
        this.syncSeek(player);
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

         wrapper.classList.add('has-played');
         wrapper.classList.add('is-playing');
         this.showTempIcon(player, true);

         // На мобильных устройствах скрывать контролы после 3 секунд воспроизведения
         // НО НЕ в лайтбоксе
         if (isTouchDevice && !wrapper.classList.contains('is-lightbox')) {
           clearTimeout(player.controlsHideTimeout);
           player.controlsHideTimeout = setTimeout(() => {
             wrapper.classList.add('controls-hidden');
           }, 3000);
         }
       });

        video.addEventListener('pause', () => {
          this.showTempIcon(player, false);
          wrapper.classList.remove('is-playing');

          // На мобильных показывать контролы при паузе
          if (isTouchDevice) {
            clearTimeout(player.controlsHideTimeout);
            wrapper.classList.remove('controls-hidden');
          }
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
          backBufferLength: 60,
          debug: false,
          maxBufferLength: 20,
          maxMaxBufferLength: 40,
          maxLoadingDelay: 3,
          maxBufferHole: 0.3,
          startLevel: -1
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
}
