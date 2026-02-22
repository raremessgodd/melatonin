import { LightboxManager } from './components/LightboxManager.js';
import { PanelTransitionManager } from './components/PanelTransitionManager.js';
import { AudioPlayerManager } from './components/AudioPlayerManager.js';
import { FullscreenManager } from './components/FullscreenManager.js';
import { ScrollManager } from './components/ScrollManager.js';
import { LazyMediaManager } from './components/LazyMediaManager.js';
import { VideoPlayerManager } from './components/VideoPlayerManager.js';
import { TerminalAnimationManager } from './components/TerminalAnimationManager.js';
import { PhotoStackManager } from './components/PhotoStackManager.js';

export class App {
  constructor() {
    this.lightboxManager = null;
    this.panelTransitionManager = null;
    this.audioManager = null;
    this.scrollManager = null;
    this.lazyMediaManager = null;
    this.videoPlayerManager = null;
    this.terminalAnimationManager = null;
    this.photoStackManager = null;
    this.handleClick = this.handleClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleActivation = this.handleActivation.bind(this);

    this.init();
  }

  getPageKey() {
    // Astro-вариант: ключ страницы в <meta name="page-key">
    const metaTag = document.querySelector('meta[name="page-key"]');
    if (metaTag?.content) return metaTag.content;

    // Оригинальный вариант (обратная совместимость): data-page на <script>
    const scriptTag = document.querySelector('script[data-page]');
    return scriptTag?.dataset.page || '';
  }

  async init() {
    // is-booting уже стоит на body из HTML (BaseLayout).
    // При View Transitions новый body тоже приходит с is-booting из SSR.
    // Просто убеждаемся что класс есть на случай если что-то его убрало раньше.
    document.body.classList.add('is-booting');

    try {
      await this.waitForLoaderImage();

      const page = this.getPageKey();

      this.panelTransitionManager = new PanelTransitionManager();

      // Грузим фоны, но не блокируем дольше 3 секунд
      await Promise.race([
        this.panelTransitionManager.preloadBackgrounds({ strategy: 'all' }),
        this.delay(3000),
      ]);
      document.body.classList.add('is-bg-ready');

      await this.nextFrame(2);
      document.body.classList.add('is-text-ready');

      await this.delay(150);
      this.lazyMediaManager = new LazyMediaManager({ deferVideos: true });

      this.lightboxManager = new LightboxManager(this.lazyMediaManager);
      this.audioManager = new AudioPlayerManager();
      this.scrollManager = new ScrollManager();
      this.videoPlayerManager = new VideoPlayerManager();

      if (page === 'about') {
        this.photoStackManager = new PhotoStackManager();
        if (!document.body.classList.contains('has-photo-stack')) {
          this.terminalAnimationManager = new TerminalAnimationManager();
        }
      }

      if (page === 'wip') {
        this.terminalAnimationManager = new TerminalAnimationManager();
      }

      this.bindUIEvents();

      document.body.classList.add('is-media-ready');
      await this.lazyMediaManager.whenImagesSettled({ timeoutMs: 2500, quietWindowMs: 500 });
      this.lazyMediaManager.enableVideos();
    } catch (error) {
      console.error('App init failed', error);
      document.body.classList.add('is-bg-ready', 'is-text-ready', 'is-media-ready');
    } finally {
      // is-bg-ready уже добавлен выше — CSS прячет .boot-loader по этому классу
      document.body.classList.remove('is-booting');
    }
  }

  /** Очищает все менеджеры — вызывается при View Transitions перед уходом со страницы */
  destroy() {
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeydown);

    this.panelTransitionManager?.destroy();
    this.videoPlayerManager?.destroy();
    this.scrollManager?.destroy();
    this.lazyMediaManager?.destroy?.();
    this.lightboxManager?.destroy?.();
    this.photoStackManager?.destroy?.();
    this.terminalAnimationManager?.destroy?.();
    this.audioManager?.destroy?.();

    this.panelTransitionManager = null;
    this.videoPlayerManager = null;
    this.scrollManager = null;
    this.lazyMediaManager = null;
    this.lightboxManager = null;
    this.photoStackManager = null;
    this.terminalAnimationManager = null;
    this.audioManager = null;
  }

  async waitForLoaderImage(timeoutMs = 300) {
    const loaderImg = document.querySelector('.boot-loader__spinner img');
    if (!loaderImg) return;
    if (loaderImg.complete && loaderImg.naturalWidth > 0) return;

    await Promise.race([
      new Promise((resolve) => {
        loaderImg.addEventListener('load', resolve, { once: true });
        loaderImg.addEventListener('error', resolve, { once: true });
      }),
      this.delay(timeoutMs)
    ]);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  nextFrame(count = 1) {
    return new Promise((resolve) => {
      const step = (remaining) => {
        if (remaining <= 0) {
          resolve();
          return;
        }
        requestAnimationFrame(() => step(remaining - 1));
      };
      step(count);
    });
  }

  bindUIEvents() {
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeydown);
  }

  handleClick(event) {
    this.handleActivation(event, { fromKeyboard: false });
  }

  handleKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    this.handleActivation(event, { fromKeyboard: true });
  }

  handleActivation(event, options = {}) {
    const { fromKeyboard } = options;
    const target = event.target;

    const preventDefault = () => {
      if (fromKeyboard) {
        event.preventDefault();
      }
    };

    const handlers = [
      () => {
        const fullscreenTrigger = target.closest('[data-fullscreen]');
        if (!fullscreenTrigger) return false;
        preventDefault();
        const container = fullscreenTrigger.closest('.player-artwork') || fullscreenTrigger.parentElement;
        if (container) {
          FullscreenManager.toggleFullscreen(container);
        }
        return true;
      },
      () => {
        const imageFullscreenTrigger = target.closest('[data-image-fullscreen]');
        if (!imageFullscreenTrigger) return false;
        event.preventDefault();
        if (!fromKeyboard) {
          event.stopPropagation();
        }
        const wrapper = imageFullscreenTrigger.closest('.media-wrapper');
        if (wrapper) {
          this.lightboxManager.openLightbox(wrapper);
        }
        return true;
      },
      () => {
        const lightboxTrigger = target.closest('[data-lightbox]');
        if (!lightboxTrigger) return false;
        if (!fromKeyboard && target.classList.contains('fullscreen-btn')) {
          return true;
        }
        preventDefault();
        const container = lightboxTrigger.querySelector('img')
          ? lightboxTrigger
          : lightboxTrigger.closest('.media-wrapper, .player-artwork');
        this.lightboxManager.openLightbox(container || lightboxTrigger);
        return true;
      },
      () => {
        const videoFullscreenTrigger = target.closest('[data-video-fullscreen]');
        if (!videoFullscreenTrigger) return false;
        preventDefault();
        const wrapper = videoFullscreenTrigger.closest('.video-player');
        if (wrapper) {
          const isLightboxOpen = this.lightboxManager
            && this.lightboxManager.videoState
            && this.lightboxManager.videoState.wrapper === wrapper;
          if (isLightboxOpen) {
            this.lightboxManager.closeLightbox();
          } else {
            this.lightboxManager.openVideoLightbox(wrapper);
          }
        }
        return true;
      }
    ];

    handlers.some((handler) => handler());
  }
}
