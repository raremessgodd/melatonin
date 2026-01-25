import { DOMUtils } from '../utils/DOMUtils.js';
import { BackgroundCanvasManager } from './BackgroundCanvasManager.js';

export class PanelTransitionManager {
  constructor() {
    this.panels = [...document.querySelectorAll('.panel')];
    this.header = document.querySelector('.page-title--top');
    this.footer = document.querySelector('.page-title--bottom');
    
    // Background images array - one for each panel
    this.backgroundImages = [
      'assets/img/mi(1).jpeg',        // First panel (Introduction)
      'assets/img/mi(1)_bl.jpg',      // Second panel (Album)
      'assets/img/mi(1)_gr.jpg',      // Third panel (Promo)
      'assets/img/mi(1)_yl.jpg'       // Fourth panel (Live Performance)
    ];
    
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
    
    this.init();
  }
  
  init() {
    if (this.panels.length === 0) return;
    
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
    const options = {
      root: null,
      rootMargin: '-20% 0px -20% 0px', // Trigger when panel is 20% from top/bottom
      threshold: 0.3
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isTransitioning) {
          const panelIndex = this.panels.indexOf(entry.target);
          if (panelIndex !== -1 && panelIndex < this.backgroundImages.length) {
            this.changeBackground(panelIndex);
          }
        }
      });
    }, options);
    
    // Observe all panels
    this.panels.forEach(panel => {
      this.observer.observe(panel);
    });
  }
  
  changeBackground(newIndex) {
    if (newIndex === this.currentBgIndex || !this.backgroundImages[newIndex]) return;
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    const newBgUrl = this.backgroundImages[newIndex];
    
    // Determine which canvas is currently visible
    const visibleCanvas = this.activeCanvas === 'A' ? this.canvasA : this.canvasB;
    const hiddenCanvas = this.activeCanvas === 'A' ? this.canvasB : this.canvasA;
    const visibleManager = this.activeCanvas === 'A' ? this.canvasManagerA : this.canvasManagerB;
    const hiddenManager = this.activeCanvas === 'A' ? this.canvasManagerB : this.canvasManagerA;
    
    // Change image on hidden canvas
    hiddenManager.changeImage(newBgUrl);
    
    // Wait a bit for the image to start loading, then start rendering
    setTimeout(() => {
      hiddenManager.startRendering();
      
      // Start cross-fade transition
      this.fadeCanvas(hiddenCanvas, visibleCanvas, hiddenManager, visibleManager, newIndex);
    }, 50);
  }
  
  fadeCanvas(newCanvas, oldCanvas, newManager, oldManager, newIndex) {
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
        
        // Stop rendering old canvas
        oldManager.stopRendering();
        
        // Swap active canvas
        this.activeCanvas = this.activeCanvas === 'A' ? 'B' : 'A';
        this.currentBgIndex = newIndex;
        this.isTransitioning = false;
      }
    };
    
    requestAnimationFrame(animate);
  }
}
