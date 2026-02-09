export class LineGalleryManager {
  constructor() {
    this.galleries = [...document.querySelectorAll('[data-line-gallery]')];
    this.handleClick = this.handleClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

    this.dragState = null;
    this.dragThreshold = 10;
    this.isDragging = false;
    this.stepCooldown = 0;

    this.init();
  }

  init() {
    this.galleries.forEach((gallery) => {
      const items = [...gallery.querySelectorAll('[data-line-item]')];
      if (items.length === 0) return;
      gallery.dataset.activeIndex = '0';
      this.applyLayout(gallery);
      gallery.classList.add('is-ready');

      gallery.addEventListener('click', this.handleClick);
      gallery.addEventListener('dragstart', (event) => event.preventDefault());
      gallery.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    });

    document.addEventListener('keydown', this.handleKeydown);
  }

  handleClick(event) {
    const gallery = event.currentTarget;
    const item = event.target.closest('[data-line-item]');
    if (item) {
      const index = Number(item.dataset.index);
      const isActive = item.classList.contains('is-active');
      if (!isActive) {
        event.preventDefault();
        event.stopPropagation();
        this.setActiveIndex(gallery, index);
      }
      return;
    }

  }

  handleKeydown(event) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) return;
    const gallery = this.galleries[0];
    if (!gallery) return;
    this.step(gallery, event.key === 'ArrowUp' ? -1 : 1);
  }

  handlePointerDown(event) {
    const gallery = event.currentTarget;
    if (!gallery) return;
    event.preventDefault();
    this.dragState = {
      gallery,
      startY: event.clientY,
      accumulated: 0,
      lastStepAt: 0,
      didStep: false
    };
    this.isDragging = false;
    gallery.setPointerCapture(event.pointerId);
    gallery.addEventListener('pointermove', this.handlePointerMove);
    gallery.addEventListener('pointerup', this.handlePointerUp, { once: true });
    gallery.addEventListener('pointercancel', this.handlePointerUp, { once: true });
  }

  handlePointerMove(event) {
    if (!this.dragState) return;
    const delta = event.clientY - this.dragState.startY;
    if (!this.isDragging && Math.abs(delta) > this.dragThreshold) {
      this.isDragging = true;
    }
    if (this.isDragging) {
      event.preventDefault();
      this.dragState.accumulated += delta;
      this.dragState.startY = event.clientY;
      const now = performance.now();
      if (!this.dragState.didStep
        && now - this.dragState.lastStepAt > 140
        && Math.abs(this.dragState.accumulated) > 14) {
        this.step(this.dragState.gallery, this.dragState.accumulated > 0 ? -1 : 1);
        this.dragState.accumulated = 0;
        this.dragState.lastStepAt = now;
        this.dragState.didStep = true;
      }
    }
  }

  handlePointerUp(event) {
    if (!this.dragState) return;
    const { gallery, accumulated } = this.dragState;
    gallery.releasePointerCapture(event.pointerId);
    gallery.removeEventListener('pointermove', this.handlePointerMove);
    if (this.isDragging && !this.dragState.didStep && Math.abs(accumulated) > this.dragThreshold) {
      this.step(gallery, accumulated > 0 ? -1 : 1);
    }
    this.dragState = null;
    this.isDragging = false;
  }

  setActiveIndex(gallery, index) {
    const items = [...gallery.querySelectorAll('[data-line-item]')];
    if (items.length === 0) return;
    const total = items.length;
    const nextIndex = (index + total) % total;
    gallery.dataset.activeIndex = nextIndex.toString();
    this.applyLayout(gallery);
  }

  step(gallery, direction) {
    const now = performance.now();
    if (now - this.stepCooldown < 140) return;
    this.stepCooldown = now;
    const current = Number(gallery.dataset.activeIndex || 0);
    this.setActiveIndex(gallery, current + direction);
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
    }, 220);
  }

  applyLayout(gallery) {
    const items = [...gallery.querySelectorAll('[data-line-item]')];
    const total = items.length;
    const activeIndex = Number(gallery.dataset.activeIndex || 0);
    const rect = gallery.getBoundingClientRect();
    const spacing = Math.min(320, rect.height * 0.38);

    items.forEach((item, index) => {
      const diff = this.wrapDiff(index - activeIndex, total);
      const abs = Math.abs(diff);

      const translateY = diff * spacing;
      const scale = diff === 0 ? 1.1 : 0.85;
      const opacity = diff === 0 ? 1 : abs === 1 ? 0.8 : 0;
      const blur = diff === 0 ? 0 : abs === 1 ? 1 : 0;

      item.style.transform = `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`;
      item.style.opacity = opacity.toString();
      item.style.filter = blur ? `blur(${blur}px)` : 'none';
      item.style.zIndex = `${100 - abs}`;
      item.style.pointerEvents = abs <= 1 ? 'auto' : 'none';
      item.classList.toggle('is-active', diff === 0);
    });
  }

  wrapDiff(diff, total) {
    const half = total / 2;
    if (diff > half) return diff - total;
    if (diff < -half) return diff + total;
    return diff;
  }
}
