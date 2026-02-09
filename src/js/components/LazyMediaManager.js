export class LazyMediaManager {
  constructor(options = {}) {
    this.deferVideos = Boolean(options.deferVideos);
    this.videoEnabled = !this.deferVideos;
    this.pendingVideos = new Set();
    this.pendingImages = new Set();
    this.lastImageStartTime = 0;
    this.priorityQueue = []; // Очередь приоритетных загрузок

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

    const srcset = item.dataset.srcset;
    const sizes = item.dataset.sizes;

    this.lastImageStartTime = performance.now();
    this.pendingImages.add(item);

    const onDone = () => {
      item.removeEventListener('load', onDone);
      item.removeEventListener('error', onDone);
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

  /**
   * Загружает медиафайл с максимальным приоритетом (для лайтбокса)
   * @param {HTMLElement} element - элемент img или video
   * @param {string} highQualitySrc - путь к файлу максимального качества
   * @returns {Promise} промис, который резолвится после загрузки
   */
  loadWithPriority(element, highQualitySrc) {
    return new Promise((resolve, reject) => {
      if (!element || !highQualitySrc) {
        reject(new Error('Invalid element or source'));
        return;
      }

      // Добавляем в очередь приоритетных
      this.priorityQueue.push({ element, src: highQualitySrc });

      if (element.tagName === 'IMG') {
        const img = element;

        // Устанавливаем высокий приоритет загрузки
        img.fetchPriority = 'high';

        const onLoad = () => {
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          this.priorityQueue = this.priorityQueue.filter(item => item.element !== element);
          resolve(img);
        };

        const onError = (error) => {
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          this.priorityQueue = this.priorityQueue.filter(item => item.element !== element);
          reject(error);
        };

        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);

        // Загружаем изображение максимального качества
        img.src = highQualitySrc;

      } else if (element.tagName === 'VIDEO') {
        const video = element;

        const onLoadedData = () => {
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          this.priorityQueue = this.priorityQueue.filter(item => item.element !== element);
          resolve(video);
        };

        const onError = (error) => {
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          this.priorityQueue = this.priorityQueue.filter(item => item.element !== element);
          reject(error);
        };

        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('error', onError);

        // Загружаем видео максимального качества
        video.src = highQualitySrc;
        video.load();
      }
    });
  }
}
