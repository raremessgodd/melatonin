import { createPlayIcon } from '../utils/SvgIcons.js';
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
       // Не перезаписываем video.muted — атрибут muted уже стоит в HTML (нужен для autoplay)

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

       // Клик на centerToggle запускает видео
       if (centerToggle) {
         centerToggle.addEventListener('click', (e) => {
           e.preventDefault();
           e.stopPropagation();
           if (video.paused) {
             this._playOrInit(player);
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
           this._playOrInit(player);
         } else {
           video.pause();
         }
       });

       const swallowControlEvent = (event) => event.stopPropagation();

      const seekWrapper = seek.closest('.video-player__seek-wrapper');
      if (seekWrapper) {
        // seekWrapper покрывает все дочерние элементы, включая seek
        ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach((eventName) => {
          seekWrapper.addEventListener(eventName, swallowControlEvent);
        });
      } else {
        // Fallback: навешиваем только на seek, если wrapper ещё не создан
        ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach((eventName) => {
          seek.addEventListener(eventName, swallowControlEvent);
        });
      }

      const addActiveClass    = () => seekWrapper?.classList.add('is-seeking');
      const removeActiveClass = () => seekWrapper?.classList.remove('is-seeking');

      ['pointerdown', 'touchstart', 'mousedown'].forEach((ev) => seek.addEventListener(ev, addActiveClass));
      ['pointerup', 'touchend', 'mouseup', 'pointercancel', 'touchcancel'].forEach((ev) => seek.addEventListener(ev, removeActiveClass));

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

      // Единый обработчик timeupdate: синхронизация seek + буфер
      video.addEventListener('timeupdate', () => {
        if (!player.isScrubbing) {
          this.syncSeek(player);
          this.updateBufferBar(player);
        }
      });

      video.addEventListener('play', () => {
        wrapper.classList.add('has-played', 'is-playing');
        wrapper.classList.remove('is-paused');
        this.showTempPlayIcon(player);

        if (isTouchDevice && !wrapper.classList.contains('is-lightbox')) {
          clearTimeout(player.controlsHideTimeout);
          player.controlsHideTimeout = setTimeout(() => {
            wrapper.classList.add('controls-hidden');
          }, 3000);
        }
      });

      video.addEventListener('pause', () => {
        wrapper.classList.remove('is-playing');
        wrapper.classList.add('is-paused');
        this.hideTempIcon(player);

        if (isTouchDevice) {
          clearTimeout(player.controlsHideTimeout);
          wrapper.classList.remove('controls-hidden');
        }
      });

      video.addEventListener('progress', () => {
        this.updateBufferBar(player);
      });


      wrapper.classList.toggle('is-playing', !video.paused);
     });
   }

  /** Инициализирует источник (если нужно) и запускает воспроизведение */
  _playOrInit(player) {
    // Пользователь кликнул — снимаем muted для звука
    player.video.muted = false;
    player.video.volume = DEFAULT_VOLUME;

    if (!player.initialized) {
      this.initSource(player).then(() => {
        player.video.play().catch((err) => {
          console.warn('Video play failed:', err);
          // Если autoplay отклонён — пробуем с muted
          player.video.muted = true;
          player.video.play().catch(() => {});
        });
      });
    } else {
      player.video.play().catch(() => {});
    }
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

  async initSource(player) {
    const { video } = player;
    if (player.initialized) return;
    player.initialized = true; // Ставим сразу чтобы не было двойного вызова

    const hlsSrc = video.dataset.hlsSrc;

    // Уничтожаем предыдущий инстанс, если есть
    const existingHls = this.hlsInstances.get(video);
    if (existingHls) {
      try { existingHls.detachMedia(); existingHls.destroy(); } catch (_) {}
      this.hlsInstances.delete(video);
    }

    if (!hlsSrc) return;

    const { default: Hls } = await import('hls.js');

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
        debug: false,
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        maxLoadingDelay: 3,
        maxBufferHole: 0.3,
        startLevel: -1,
      });

      let errorRecoveryAttempts = 0;
      const maxRecoveryAttempts = 3;
      let manifestReadyResolve = null;

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && errorRecoveryAttempts++ < maxRecoveryAttempts) {
            hls.recoverMediaError();
          } else {
            console.warn('HLS fatal error:', data);
            // Резолвим ожидание чтобы не зависнуть
            manifestReadyResolve?.();
          }
        }
      });

      // Ждём MANIFEST_PARSED или фатальной ошибки (с таймаутом 8с)
      const ready = new Promise((resolve) => {
        manifestReadyResolve = resolve;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.setupPosterCapture(video);
          resolve();
        });
      });

      hls.loadSource(hlsSrc);
      hls.attachMedia(video);

      await Promise.race([ready, new Promise((r) => setTimeout(r, 8000))]);

      this.hlsInstances.set(video, hls);

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — нативная поддержка HLS
      video.src = hlsSrc;
      video.load();
      this.setupPosterCapture(video);
      // Ждём loadedmetadata для Safari
      await new Promise((resolve) => {
        video.addEventListener('loadedmetadata', resolve, { once: true });
      });
    }
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
    if (!player.seek.parentElement.classList.contains('video-player__seek-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'video-player__seek-wrapper';
      Object.assign(wrapper.style, {
        position: 'relative',
        flex: '1',
        minWidth: '140px',
        display: 'flex',
        alignItems: 'center'
      });

      player.seek.parentNode.insertBefore(wrapper, player.seek);
      wrapper.appendChild(player.seek);

      const bufferBar = document.createElement('div');
      bufferBar.className = 'video-player__seek-buffer';
      wrapper.appendChild(bufferBar);
      player.bufferBar = bufferBar;
    }
  }
  // Показать мигающий треугольник при старте воспроизведения
  showTempPlayIcon(player) {
    if (!player.tempIcon) return;

    player.tempIcon.style.animation = 'none';
    player.tempIcon.offsetHeight; // force reflow

    player.tempIcon.innerHTML = '';
    player.tempIcon.appendChild(createPlayIcon());

    player.tempIcon.style.animation = 'tempIconFade 0.6s ease-out';
  }

  // Скрыть temp-icon (сбросить анимацию)
  hideTempIcon(player) {
    if (!player.tempIcon) return;
    player.tempIcon.style.animation = 'none';
    player.tempIcon.innerHTML = '';
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
