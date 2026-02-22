export class LazyMediaManager {
  constructor(options = {}) {
    this.deferVideos = Boolean(options.deferVideos);
    this.videoEnabled = !this.deferVideos;
    this.pendingVideos = new Set();
    this.pendingImages = new Set();
    this.lastImageStartTime = 0;
    this._destroyed = false;

    this.observe = this.observe.bind(this);
    this.onIntersect = this.onIntersect.bind(this);

    this.init();
  }

  init() {
    const lazyItems = Array.from(document.querySelectorAll('[data-lazy-media]'));
    if (!lazyItems.length) return;

    if (!('IntersectionObserver' in window)) {
      lazyItems.forEach((item) => this.loadItem(item));
      return;
    }

    this.observer = new IntersectionObserver(this.onIntersect, {
      root: null,
      rootMargin: '200px 0px',
      threshold: 0.1
    });

    lazyItems.forEach(this.observe);
  }

  observe(item) {
    if (this.observer) {
      this.observer.observe(item);
    }
  }

  onIntersect(entries) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const item = entry.target;
      this.loadItem(item);
      this.observer.unobserve(item);
    });
  }

  loadItem(item) {
    if (item.tagName === 'VIDEO') {
      if (!this.videoEnabled) {
        this.pendingVideos.add(item);
        return;
      }
      this.loadVideo(item);
      return;
    }

    if (item.tagName === 'IMG') {
      // Пропускаем уже загруженные элементы
      if (item.dataset.lazyLoaded === '1') return;
      this.loadImage(item);
    }
  }

  loadVideo(item) {
    if (!item) return;
    item.dataset.lazyLoaded = '1';
    item.dispatchEvent(new Event('lazy-video-load'));
  }

  loadImage(item) {
    const src = item.dataset.src;
    if (!src) return;

    // Если src уже установлен и совпадает — не делаем повторный запрос
    if (item.src && item.src === new URL(src, location.href).href) {
      item.dataset.lazyLoaded = '1';
      return;
    }

    const srcset = item.dataset.srcset;
    const sizes = item.dataset.sizes;

    this.lastImageStartTime = performance.now();
    this.pendingImages.add(item);

    const onDone = () => {
      item.removeEventListener('load', onDone);
      item.removeEventListener('error', onDone);
      item.dataset.lazyLoaded = '1';
      this.pendingImages.delete(item);
    };

    item.addEventListener('load', onDone, { once: true });
    item.addEventListener('error', onDone, { once: true });
    if (srcset) {
      item.srcset = srcset;
    }
    if (sizes) {
      item.sizes = sizes;
    }
    item.src = src;

    if (item.complete) {
      onDone();
    }
  }

  whenImagesSettled(options = {}) {
    const timeoutMs = options.timeoutMs ?? 2000;
    const quietWindowMs = options.quietWindowMs ?? 400;

    return new Promise((resolve) => {
      const startTime = performance.now();

      const check = () => {
        if (this._destroyed) { resolve(); return; }
        const now = performance.now();
        const quietFor = now - this.lastImageStartTime;
        const timedOut = now - startTime >= timeoutMs;
        if ((this.pendingImages.size === 0 && quietFor >= quietWindowMs) || timedOut) {
          resolve();
          return;
        }
        setTimeout(check, 100);
      };

      check();
    });
  }

  enableVideos() {
    if (this.videoEnabled) return;
    this.videoEnabled = true;
    this.pendingVideos.forEach((item) => this.loadVideo(item));
    this.pendingVideos.clear();
  }

  destroy() {
    this._destroyed = true;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.pendingImages.clear();
    this.pendingVideos.clear();
  }

  /**
   * Ожидает загрузки элемента по событию loadEvent (или error).
   * @param {HTMLElement} el
   * @param {string} loadEvent - 'load' | 'loadeddata'
   * @returns {Promise<HTMLElement>}
   */
  _waitForLoad(el, loadEvent) {
    return new Promise((resolve, reject) => {
      const onLoad = () => { cleanup(); resolve(el); };
      const onError = (err) => { cleanup(); reject(err); };
      const cleanup = () => {
        el.removeEventListener(loadEvent, onLoad);
        el.removeEventListener('error', onError);
      };
      el.addEventListener(loadEvent, onLoad, { once: true });
      el.addEventListener('error', onError, { once: true });
    });
  }

  /**
   * Загружает медиафайл с максимальным приоритетом (для лайтбокса).
   * @param {HTMLElement} element - img или video
   * @param {string} highQualitySrc - путь к файлу максимального качества
   * @returns {Promise<HTMLElement>}
   */
  loadWithPriority(element, highQualitySrc) {
    if (!element || !highQualitySrc) {
      return Promise.reject(new Error('Invalid element or source'));
    }

    if (element.tagName === 'IMG') {
      element.fetchPriority = 'high';
      const promise = this._waitForLoad(element, 'load');
      element.src = highQualitySrc;
      return promise;
    }

    if (element.tagName === 'VIDEO') {
      const promise = this._waitForLoad(element, 'loadeddata');
      element.src = highQualitySrc;
      element.load();
      return promise;
    }

    return Promise.reject(new Error(`Unsupported element: ${element.tagName}`));
  }
}
