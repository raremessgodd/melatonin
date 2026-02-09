import { BackgroundCanvasManager } from './BackgroundCanvasManager.js';

export class PanelTransitionManager {
  constructor() {
    this.panels = [...document.querySelectorAll('.panel')];
    
    this.backgroundImages = [];
    
    this.currentBgIndex = 0;
    this.isTransitioning = false;
    this.observer = null;
    
    // Canvas elements for cross-fade
    this.strip = document.getElementById('strip');
    this.canvasA = null;
    this.canvasB = null;
    this.canvasManagerA = null;
    this.canvasManagerB = null;
    this.activeCanvas = 'A';
    this.pendingBgIndex = 0;
    this.transitionToken = 0;
    this.preloadPromise = null;
    
    this.observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: 0.3
    };

    this.init();
  }
  
  init() {
    if (this.panels.length === 0) return;

    this.backgroundImages = this.panels.map((panel) => panel.dataset.bg || null);
    
    // Create two canvas layers for cross-fade
    this.createCanvasLayers();
    
    // Initialize canvas managers
    this.initCanvasManagers();
    
    // Set all panels to normal scroll layout
    this.setupNormalLayout();
    
    // Setup scroll-based background changes
    this.setupScrollBackgrounds();
  }
  
  createCanvasLayers() {
    if (!this.strip) return;
    
    // Remove existing canvas if any
    const existingCanvas = document.getElementById('stripCanvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }
    
    // Create canvas A (visible)
    this.canvasA = document.createElement('canvas');
    this.canvasA.id = 'stripCanvasA';
    this.canvasA.style.position = 'absolute';
    this.canvasA.style.top = '0';
    this.canvasA.style.left = '0';
    this.canvasA.style.width = '100%';
    this.canvasA.style.height = '100%';
    this.canvasA.style.opacity = '1';
    this.canvasA.style.transition = 'opacity 0.8s ease';
    this.strip.appendChild(this.canvasA);
    
    // Create canvas B (hidden, for transition)
    this.canvasB = document.createElement('canvas');
    this.canvasB.id = 'stripCanvasB';
    this.canvasB.style.position = 'absolute';
    this.canvasB.style.top = '0';
    this.canvasB.style.left = '0';
    this.canvasB.style.width = '100%';
    this.canvasB.style.height = '100%';
    this.canvasB.style.opacity = '0';
    this.canvasB.style.transition = 'opacity 0.8s ease';
    this.canvasB.style.pointerEvents = 'none';
    this.strip.appendChild(this.canvasB);
  }
  
  initCanvasManagers() {
    // Initialize canvas A with first image
    this.canvasManagerA = new BackgroundCanvasManager(
      this.canvasA,
      this.backgroundImages[0],
      this.strip
    );
    this.canvasManagerA.startRendering();
    
    // Initialize canvas B (will be used for transitions)
    this.canvasManagerB = new BackgroundCanvasManager(
      this.canvasB,
      this.backgroundImages[0],
      this.strip
    );
    // Don't start rendering B yet, it will be activated during transitions
  }
  
  setupNormalLayout() {
    // Reset all panels to normal flow for scrolling
    this.panels.forEach((panel, index) => {
      panel.style.position = 'relative';
      panel.style.top = 'auto';
      panel.style.left = 'auto';
      panel.style.width = '100%';
      panel.style.height = 'auto';
      panel.style.minHeight = '100vh';
      panel.style.paddingTop = '';
      panel.style.paddingBottom = '';
      panel.style.opacity = '1';
      panel.style.pointerEvents = 'auto';
      panel.style.display = '';
      panel.style.boxSizing = '';
      panel.classList.add('is-visible');
    });
  }
  
  setupScrollBackgrounds() {
    // Use Intersection Observer to detect when panels enter viewport
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const panelIndex = this.panels.indexOf(entry.target);
          if (panelIndex !== -1 && panelIndex < this.backgroundImages.length) {
            this.requestBackground(panelIndex);
          }
        }
      });
    }, this.observerOptions);
    
    // Observe all panels
    this.panels.forEach(panel => {
      this.observer.observe(panel);
    });
  }
  
  changeBackground(newIndex) {
    if (newIndex === this.currentBgIndex || !this.backgroundImages[newIndex]) return;
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    const transitionId = ++this.transitionToken;
    const newBgUrl = this.backgroundImages[newIndex];
    
    // Determine which canvas is currently visible
    const visibleCanvas = this.activeCanvas === 'A' ? this.canvasA : this.canvasB;
    const hiddenCanvas = this.activeCanvas === 'A' ? this.canvasB : this.canvasA;
    const visibleManager = this.activeCanvas === 'A' ? this.canvasManagerA : this.canvasManagerB;
    const hiddenManager = this.activeCanvas === 'A' ? this.canvasManagerB : this.canvasManagerA;
    
    // Change image on hidden canvas
    hiddenManager.changeImage(newBgUrl).then((loaded) => {
      if (!loaded || transitionId !== this.transitionToken) {
        this.isTransitioning = false;
        this.pendingBgIndex = this.currentBgIndex;
        return;
      }

      this.fadeCanvas(hiddenCanvas, visibleCanvas, hiddenManager, visibleManager, newIndex, () => {
        if (this.pendingBgIndex !== this.currentBgIndex) {
          this.changeBackground(this.pendingBgIndex);
        }
      });
    });
  }
  
  fadeCanvas(newCanvas, oldCanvas, newManager, oldManager, newIndex, onComplete) {
    const duration = 200; // milliseconds - longer for smoother fade
    const startTime = performance.now();
    const startOpacity = 0;
    const endOpacity = 1;
    
    // Ensure new canvas is on top
    newCanvas.style.zIndex = '2';
    oldCanvas.style.zIndex = '1';
    
    // Smooth easing function (ease-in-out cubic)
    const easeInOutCubic = (t) => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use smooth cubic easing
      const easeProgress = easeInOutCubic(progress);
      
      const opacity = startOpacity + (endOpacity - startOpacity) * easeProgress;
      newCanvas.style.opacity = opacity;
      oldCanvas.style.opacity = 1 - opacity;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Transition complete
        newCanvas.style.opacity = '1';
        oldCanvas.style.opacity = '0';
        
        // Stop any pending render on the old canvas
        oldManager.stopRendering();
        
        // Swap active canvas
        this.activeCanvas = this.activeCanvas === 'A' ? 'B' : 'A';
        this.currentBgIndex = newIndex;
        this.isTransitioning = false;
        if (onComplete) {
          onComplete();
        }
      }
    };
    
    requestAnimationFrame(animate);
  }

  requestBackground(index) {
    if (index === this.currentBgIndex) return;
    this.pendingBgIndex = index;
    if (this.isTransitioning) return;
    this.changeBackground(index);
  }

  preloadImages() {
    return this.preloadBackgrounds({ strategy: 'adjacent' });
  }

  preloadBackgrounds(options = {}) {
    if (this.preloadPromise) return this.preloadPromise;

    const strategy = options.strategy || 'all';
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = connection && connection.saveData;
    const effectiveType = connection && connection.effectiveType ? connection.effectiveType : '';
    const isSlow = effectiveType === '2g' || effectiveType === 'slow-2g';
    const maxConcurrency = options.concurrency || (isSlow || saveData ? 1 : 3);

    const sources = this.buildBackgroundQueue(strategy);
    if (!sources.length) {
      this.preloadPromise = Promise.resolve();
      return this.preloadPromise;
    }

    this.preloadPromise = this.runPreloadQueue(sources, maxConcurrency);
    return this.preloadPromise;
  }

  buildBackgroundQueue(strategy) {
    const all = this.backgroundImages.filter(Boolean);
    if (strategy === 'adjacent') {
      const nextIndexes = [this.currentBgIndex + 1, this.currentBgIndex - 1]
        .filter((index) => index >= 0 && index < this.backgroundImages.length);
      return nextIndexes.map((index) => this.backgroundImages[index]).filter(Boolean);
    }

    const current = this.backgroundImages[this.currentBgIndex];
    const ordered = current ? [current, ...all.filter((src) => src !== current)] : all.slice();
    const seen = new Set();
    return ordered.filter((src) => {
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    });
  }

  runPreloadQueue(sources, concurrency) {
    return new Promise((resolve) => {
      let index = 0;
      let active = 0;
      let completed = 0;
      const total = sources.length;

      const launchNext = () => {
        while (active < concurrency && index < total) {
          const src = sources[index++];
          active += 1;
          BackgroundCanvasManager.loadImage(src)
            .catch(() => {})
            .finally(() => {
              active -= 1;
              completed += 1;
              if (completed >= total) {
                resolve();
                return;
              }
              launchNext();
            });
        }
      };

      launchNext();
    });
  }
}
