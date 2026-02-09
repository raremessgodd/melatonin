import { LightboxManager } from './components/LightboxManager.js';
import { PanelTransitionManager } from './components/PanelTransitionManager.js';
import { AudioManager } from './components/AudioManager.js';
import { FullscreenManager } from './components/FullscreenManager.js';
import { ScrollManager } from './components/ScrollManager.js';
import { SectionRenderer } from './components/SectionRenderer.js';
import { sections } from './content/sections.js';
import { farewellsSections } from './content/farewellsSections.js';
import { aboutSections } from './content/aboutSections.js';
import { LazyMediaManager } from './components/LazyMediaManager.js';
import { VideoPlayerManager } from './components/VideoPlayerManager.js';
import { TerminalAnimationManager } from './components/TerminalAnimationManager.js';

export class App {
  constructor() {
    this.sectionRenderer = null;
    this.lightboxManager = null;
    this.panelTransitionManager = null;
    this.audioManager = null;
    this.scrollManager = null;
    this.lazyMediaManager = null;
    this.videoPlayerManager = null;
    this.terminalAnimationManager = null;
    this.handleClick = this.handleClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleActivation = this.handleActivation.bind(this);

    this.init();
  }

  getPageKey() {
    const scriptTag = document.querySelector('script[data-page]');
    return scriptTag?.dataset.page || '';
  }

  getSectionsForPage() {
    const page = this.getPageKey();

    switch (page) {
      case 'farewells':
        return farewellsSections;
      case 'about':
        return aboutSections;
      default:
        return sections;
    }
  }

  async init() {
    document.body.classList.add('is-booting');

    try {
      await this.waitForLoaderImage();

      this.sectionRenderer = new SectionRenderer(document.getElementById('content'));
      const pageSections = this.getSectionsForPage();
      this.sectionRenderer.render(pageSections);

      // PanelTransitionManager now handles BackgroundCanvasManager internally
      this.panelTransitionManager = new PanelTransitionManager();

      const backgroundPreload = this.panelTransitionManager.preloadBackgrounds({
        strategy: 'all'
      });
      await backgroundPreload;
      document.body.classList.add('is-bg-ready');

      await this.nextFrame(2);
      document.body.classList.add('is-text-ready');

      // Initialize LazyMediaManager first
      await this.delay(150);
      this.lazyMediaManager = new LazyMediaManager({ deferVideos: true });

      // Initialize all other components, passing lazyMediaManager to LightboxManager
      this.lightboxManager = new LightboxManager(this.lazyMediaManager);
      this.audioManager = new AudioManager();
      this.scrollManager = new ScrollManager();
      this.videoPlayerManager = new VideoPlayerManager();

      // Initialize terminal animation only on about page
      const page = this.getPageKey();
      if (page === 'about') {
        this.terminalAnimationManager = new TerminalAnimationManager();
      }

      this.bindUIEvents();

      document.body.classList.add('is-media-ready');
      await this.lazyMediaManager.whenImagesSettled({ timeoutMs: 2500, quietWindowMs: 500 });
      this.lazyMediaManager.enableVideos();
    } catch (error) {
      console.error('App init failed', error);
    } finally {
      document.body.classList.add('is-bg-ready');
      document.body.classList.add('is-text-ready');
      document.body.classList.add('is-media-ready');
      document.body.classList.remove('is-booting');
    }
  }

  async waitForLoaderImage(timeoutMs = 1500) {
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
        const audioTrigger = target.closest('[data-audio-toggle]');
        if (!audioTrigger) return false;
        preventDefault();
        this.audioManager.togglePlayer(audioTrigger);
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
