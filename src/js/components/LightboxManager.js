import { getMaxQualityPath } from '../utils/MediaUtils.js';

export class LightboxManager {
  constructor(lazyMediaManager = null) {
    this.lightbox = document.getElementById('lightbox');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxMedia = document.getElementById('lightbox-media');
    this.closeButton = this.lightbox ? this.lightbox.querySelector('.lightbox-close') : null;
    this.prevButton = this.lightbox ? this.lightbox.querySelector('[data-lightbox-prev]') : null;
    this.nextButton = this.lightbox ? this.lightbox.querySelector('[data-lightbox-next]') : null;
    this.galleryItems = [];
    this.galleryIndex = -1;
    this.videoState = null;
    this.lazyMediaManager = lazyMediaManager; // Для приоритетной загрузки

    // Bind methods to preserve 'this' context
    this.openLightbox = this.openLightbox.bind(this);
    this.openVideoLightbox = this.openVideoLightbox.bind(this);
    this.closeLightbox = this.closeLightbox.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.showPrev = this.showPrev.bind(this);
    this.showNext = this.showNext.bind(this);
    
    // Add event listeners
    if (this.lightbox) {
      this.lightbox.addEventListener('click', this.handleBackdropClick);
    }
    if (this.closeButton) {
      this.closeButton.addEventListener('click', this.closeLightbox);
      this.closeButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.closeLightbox();
        }
      });
    }
    if (this.prevButton) {
      this.prevButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.showPrev();
      });
    }
    if (this.nextButton) {
      this.nextButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.showNext();
      });
    }
    document.addEventListener('keydown', this.handleKeydown);
  }
  
  openLightbox(element) {
    if (!element) return;
    const img = element.querySelector('img');
    if (!img || !this.lightbox || !this.lightboxImg) return;

    const imgSrc = img.src || img.dataset.src || '';
    if (!img.src && imgSrc) {
      img.src = imgSrc;
    }
    if (this.lightboxMedia) {
      this.lightboxMedia.innerHTML = '';
      this.lightboxMedia.setAttribute('aria-hidden', 'true');
    }
    this.lightbox.classList.remove('is-video');

    // Получаем путь к максимальному качеству
    const maxQualitySrc = getMaxQualityPath(imgSrc);

    this.setupGallery(element, maxQualitySrc);

    // Сначала показываем текущее изображение (низкого качества)
    this.lightboxImg.src = imgSrc;
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Затем загружаем версию высокого качества с приоритетом
    if (this.lazyMediaManager && maxQualitySrc !== imgSrc) {
      this.lightboxImg.style.opacity = '0.9';
      this.lazyMediaManager.loadWithPriority(this.lightboxImg, maxQualitySrc)
        .then(() => {
          this.lightboxImg.style.opacity = '1';
        })
        .catch((error) => {
          console.warn('Failed to load high quality image:', error);
          this.lightboxImg.style.opacity = '1';
        });
    }
  }

  openVideoLightbox(wrapper) {
    if (!wrapper || !this.lightbox || !this.lightboxMedia) return;
    if (this.videoState) return;

    const placeholder = document.createElement('div');
    placeholder.dataset.videoPlaceholder = '';
    wrapper.parentNode?.insertBefore(placeholder, wrapper);

    this.videoState = {
      wrapper,
      placeholder
    };

    this.lightboxImg.src = '';
    this.lightbox.classList.add('is-video');
    this.lightboxMedia.setAttribute('aria-hidden', 'false');
    this.lightboxMedia.appendChild(wrapper);
    wrapper.classList.add('is-lightbox');

    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  closeLightbox() {
    if (!this.lightbox) return;

    this.lightbox.classList.remove('active');
    this.lightbox.classList.remove('is-video');
    document.body.style.overflow = '';

    if (this.videoState) {
      const { wrapper, placeholder } = this.videoState;

      wrapper.classList.remove('is-lightbox');
      if (placeholder.parentNode) {
        placeholder.parentNode.insertBefore(wrapper, placeholder);
        placeholder.remove();
      }
      this.videoState = null;
      if (this.lightboxMedia) {
        this.lightboxMedia.innerHTML = '';
        this.lightboxMedia.setAttribute('aria-hidden', 'true');
      }
    }
  }

  handleBackdropClick(event) {
    if (!this.lightbox) return;

    const isBackdrop = event.target === this.lightbox;
    const isEmptyMedia = this.lightboxMedia && event.target === this.lightboxMedia;
    if (isBackdrop || isEmptyMedia) {
      this.closeLightbox();
    }
  }

  handleKeydown(event) {
    if (!this.lightbox || !this.lightbox.classList.contains('active')) return;
    if (event.key === 'Escape') {
      this.closeLightbox();
    }
    if (event.key === 'ArrowLeft') {
      this.showPrev();
    }
    if (event.key === 'ArrowRight') {
      this.showNext();
    }
  }

  setupGallery(element, currentSrc) {
    const galleryElement = element.closest('[data-gallery]');
    if (!galleryElement) {
      this.galleryItems = [];
      this.galleryIndex = -1;
      if (this.lightbox) {
        this.lightbox.classList.remove('has-gallery');
      }
      return;
    }

    const galleryId = galleryElement.dataset.gallery;
    const nodes = [...document.querySelectorAll(`[data-gallery="${galleryId}"]`)];
    this.galleryItems = nodes
      .map((node) => node.querySelector('img'))
      .filter(Boolean)
      .map((node) => {
        const originalSrc = node.dataset.originalSrc || node.src || node.dataset.src || '';
        // Сохраняем оригинальный путь для дальнейшего использования
        if (!node.dataset.originalSrc) {
          node.dataset.originalSrc = originalSrc;
        }
        return {
          src: originalSrc,
          alt: node.alt || ''
        };
      })
      .filter((item) => item.src);
    this.galleryIndex = this.galleryItems.findIndex((item) => {
      // Сравниваем по базовому имени файла, игнорируя разрешение
      const itemBase = getMaxQualityPath(item.src);
      const currentBase = getMaxQualityPath(currentSrc);
      return itemBase === currentBase;
    });
    if (this.lightbox) {
      this.lightbox.classList.toggle('has-gallery', this.galleryItems.length > 1);
    }
  }

  showPrev() {
    if (this.galleryItems.length <= 1) return;
    this.galleryIndex = (this.galleryIndex - 1 + this.galleryItems.length) % this.galleryItems.length;
    this.updateGalleryImage();
  }

  showNext() {
    if (this.galleryItems.length <= 1) return;
    this.galleryIndex = (this.galleryIndex + 1) % this.galleryItems.length;
    this.updateGalleryImage();
  }

  updateGalleryImage() {
    const item = this.galleryItems[this.galleryIndex];
    if (!item || !this.lightboxImg) return;

    // Получаем путь к максимальному качеству
    const maxQualitySrc = getMaxQualityPath(item.src);

    // Сначала показываем текущее изображение
    this.lightboxImg.src = item.src;
    this.lightboxImg.alt = item.alt;

    // Затем загружаем версию высокого качества
    if (this.lazyMediaManager && maxQualitySrc !== item.src) {
      this.lightboxImg.style.opacity = '0.9';
      this.lazyMediaManager.loadWithPriority(this.lightboxImg, maxQualitySrc)
        .then(() => {
          this.lightboxImg.style.opacity = '1';
        })
        .catch((error) => {
          console.warn('Failed to load high quality image:', error);
          this.lightboxImg.style.opacity = '1';
        });
    }
  }
}
