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
    this.lazyMediaManager = lazyMediaManager;
    this.scrollPosition = undefined;

    this.openLightbox = this.openLightbox.bind(this);
    this.openVideoLightbox = this.openVideoLightbox.bind(this);
    this.closeLightbox = this.closeLightbox.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.showPrev = this.showPrev.bind(this);
    this.showNext = this.showNext.bind(this);

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

  // ─── Scroll lock helpers ──────────────────────────────────────────────────

  _lockScroll() {
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.classList.add('lightbox-open');
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.overflow = 'hidden';
  }

  _unlockScroll() {
    document.body.classList.remove('lightbox-open');
    document.body.style.overflow = '';
    document.body.style.top = '';
    if (this.scrollPosition !== undefined) {
      window.scrollTo({ top: this.scrollPosition, left: 0, behavior: 'instant' });
      this.scrollPosition = undefined;
    }
  }

  // ─── High-quality image loader ────────────────────────────────────────────

  _loadHighQuality(imgEl, src, lowQualitySrc) {
    if (!this.lazyMediaManager || src === lowQualitySrc) return;
    imgEl.style.opacity = '0.9';
    this.lazyMediaManager.loadWithPriority(imgEl, src)
      .then(() => { imgEl.style.opacity = '1'; })
      .catch(() => { imgEl.style.opacity = '1'; });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  openLightbox(element) {
    if (!element) return;
    const img = element.querySelector('img');
    if (!img || !this.lightbox || !this.lightboxImg) return;

    const imgSrc = img.src || img.dataset.src || '';
    if (!img.src && imgSrc) img.src = imgSrc;

    if (this.lightboxMedia) {
      this.lightboxMedia.innerHTML = '';
      this.lightboxMedia.setAttribute('aria-hidden', 'true');
    }
    this.lightbox.classList.remove('is-video');

    const maxQualitySrc = getMaxQualityPath(imgSrc);
    this.setupGallery(element, maxQualitySrc);

    this.lightboxImg.src = imgSrc;
    this.lightbox.classList.add('active');
    this.lightbox.setAttribute('aria-hidden', 'false');
    this.lightboxImg.setAttribute('aria-hidden', 'false');
    this._lockScroll();
    this._loadHighQuality(this.lightboxImg, maxQualitySrc, imgSrc);
  }

  openVideoLightbox(wrapper) {
    if (!wrapper || !this.lightbox || !this.lightboxMedia) return;
    if (this.videoState) return;

    const placeholder = document.createElement('div');
    placeholder.dataset.videoPlaceholder = '';
    wrapper.parentNode?.insertBefore(placeholder, wrapper);

    this.videoState = { wrapper, placeholder };

    this.lightboxImg.src = '';
    this.lightbox.classList.add('is-video');
    this.lightbox.setAttribute('aria-hidden', 'false');
    this.lightboxMedia.setAttribute('aria-hidden', 'false');
    this.lightboxMedia.appendChild(wrapper);
    wrapper.classList.add('is-lightbox');
    this.lightbox.classList.add('active');
    this._lockScroll();
  }

  closeLightbox() {
    if (!this.lightbox) return;

    this.lightbox.classList.remove('active', 'is-video');
    this.lightbox.setAttribute('aria-hidden', 'true');
    this.lightboxImg.setAttribute('aria-hidden', 'true');
    this._unlockScroll();

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
    if (isBackdrop || isEmptyMedia) this.closeLightbox();
  }

  handleKeydown(event) {
    if (!this.lightbox || !this.lightbox.classList.contains('active')) return;
    switch (event.key) {
      case 'Escape':     this.closeLightbox(); break;
      case 'ArrowLeft':  this.showPrev(); break;
      case 'ArrowRight': this.showNext(); break;
    }
  }

  setupGallery(element, currentSrc) {
    const galleryElement = element.closest('[data-gallery]');
    if (!galleryElement) {
      this.galleryItems = [];
      this.galleryIndex = -1;
      this.lightbox?.classList.remove('has-gallery');
      return;
    }

    const galleryId = galleryElement.dataset.gallery;
    const nodes = [...document.querySelectorAll(`[data-gallery="${galleryId}"]`)];
    this.galleryItems = nodes
      .map((node) => node.querySelector('img'))
      .filter(Boolean)
      .map((node) => {
        const originalSrc = node.dataset.originalSrc || node.src || node.dataset.src || '';
        if (!node.dataset.originalSrc) node.dataset.originalSrc = originalSrc;
        return { src: originalSrc, alt: node.alt || '' };
      })
      .filter((item) => item.src);

    this.galleryIndex = this.galleryItems.findIndex((item) => {
      return getMaxQualityPath(item.src) === getMaxQualityPath(currentSrc);
    });

    this.lightbox?.classList.toggle('has-gallery', this.galleryItems.length > 1);
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

    const maxQualitySrc = getMaxQualityPath(item.src);
    this.lightboxImg.src = item.src;
    this.lightboxImg.alt = item.alt;
    this._loadHighQuality(this.lightboxImg, maxQualitySrc, item.src);
  }
}

