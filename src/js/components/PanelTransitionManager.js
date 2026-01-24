import { DOMUtils } from '../utils/DOMUtils.js';

export class PanelTransitionManager {
  constructor() {
    this.panels = [...document.querySelectorAll('.panel')];
    this.bgA = document.getElementById('bgA');
    this.bgB = document.getElementById('bgB');
    this.header = document.querySelector('.page-title--top');
    this.footer = document.querySelector('.page-title--bottom');
    
    this.panelData = [];
    this.currentSection = 0;
    this.isTransitioning = false;
    this.transitionDirection = 0; // 1 for forward, -1 for backward
    this.transitionProgress = 0; // 0 to 1
    this.scrollDelta = 0;
    this.lastScrollTime = 0;
    this.isScrollLocked = false;
    this.touchStartY = 0;
    this.lastTouchTime = 0;
    this.isTouchLocked = false;
    
    this.init();
  }
  
  init() {
    if (this.panels.length === 0) return;
    
    // 1) Store panel data
    this.panelData = this.panels.map(p => ({
      element: p,
      bg: p.dataset.bg
    }));
    
    // 2) Preload backgrounds
    const urls = [...new Set(this.panelData.map(p => p.bg).filter(Boolean))];
    urls.forEach(u => { 
      const im = new Image(); 
      im.decoding = 'async'; 
      im.src = u; 
    });
    
    // 3) Initialize panel positions and visibility
    this.initPanels();
    
    // 4) Add event listeners with throttling for better performance
    const throttledHandleScroll = DOMUtils.throttle((event) => this.handleScroll(event), 100);
    const throttledHandleTouchMove = DOMUtils.throttle((event) => this.handleTouchMove(event), 100);
    
    window.addEventListener('wheel', throttledHandleScroll, { passive: false });
    window.addEventListener('touchstart', (event) => this.handleTouchStart(event), { passive: true });
    window.addEventListener('touchmove', throttledHandleTouchMove, { passive: false });
    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
  }
  
  setBg(el, url) {
    if (el) {
      el.style.backgroundImage = `url("${url}")`;
    }
  }
  
  // Initialize panel positions and visibility
  initPanels() {
    // Get header and footer heights
    const headerHeight = this.header ? this.header.offsetHeight : 0;
    const footerHeight = this.footer ? this.footer.offsetHeight : 0;
    
    // Calculate available height for content
    const availableHeight = `calc(100vh - ${headerHeight}px - ${footerHeight}px)`;
    
    this.panels.forEach((panel, index) => {
      // Position all panels absolutely to stack them
      panel.style.position = 'absolute';
      panel.style.top = '0';
      panel.style.left = '0';
      panel.style.width = '100%';
      panel.style.height = '100vh';
      panel.style.boxSizing = 'border-box';
      
      // Constrain panels to viewport area between header and footer
      panel.style.paddingTop = `${headerHeight}px`;
      panel.style.paddingBottom = `${footerHeight}px`;
      
      // Ensure content area has proper constraints
      panel.style.display = 'flex';
      panel.style.alignItems = 'center';
      
      // Initially hide all panels except the first
      if (index === 0) {
        panel.style.opacity = '1';
        panel.style.pointerEvents = 'auto';
        panel.classList.add('is-visible');
      } else {
        panel.style.opacity = '0';
        panel.style.pointerEvents = 'none';
        panel.classList.remove('is-visible');
      }
    });
  }
  
  // Update cross-fade transition
  updateTransition() {
    const nextSection = this.currentSection + this.transitionDirection;
    
    if (nextSection < 0 || nextSection >= this.panels.length) {
      // Reset transition if out of bounds
      this.transitionDirection = 0;
      this.transitionProgress = 0;
      this.isTransitioning = false;
      return;
    }
    
    const currentPanel = this.panelData[this.currentSection].element;
    const nextPanel = this.panelData[nextSection].element;
    
    // Update opacities for cross-fade effect
    currentPanel.style.opacity = `${1 - this.transitionProgress}`;
    nextPanel.style.opacity = `${this.transitionProgress}`;
    
    // Update background transition
    const currentBg = this.panelData[this.currentSection].bg;
    const nextBg = this.panelData[nextSection].bg;
    
    if (currentBg !== nextBg) {
      if (this.transitionProgress === 0) {
        // Starting transition - set both backgrounds
        if (currentBg) this.setBg(this.bgA, currentBg);
        if (nextBg) this.setBg(this.bgB, nextBg);
        if (this.bgB) this.bgB.style.opacity = '0';
      } else if (this.transitionProgress === 1) {
        // Finished transition - switch to next background
        if (nextBg) this.setBg(this.bgA, nextBg);
        if (this.bgB) this.bgB.style.opacity = '0';
      } else {
        // During transition - cross-fade backgrounds
        if (this.bgB) this.bgB.style.opacity = `${this.transitionProgress}`;
      }
    }
    
    // Update visibility classes
    if (this.transitionProgress > 0.5) {
      currentPanel.classList.remove('is-visible');
      nextPanel.classList.add('is-visible');
      currentPanel.style.pointerEvents = 'none';
      nextPanel.style.pointerEvents = 'auto';
    } else {
      currentPanel.classList.add('is-visible');
      nextPanel.classList.remove('is-visible');
      currentPanel.style.pointerEvents = 'auto';
      nextPanel.style.pointerEvents = 'none';
    }
    
    // Complete transition
    if (this.transitionProgress >= 1) {
      this.currentSection = nextSection;
      this.transitionDirection = 0;
      this.transitionProgress = 0;
      this.isTransitioning = false;
    }
  }
  
  // Navigation functions with cross-fade
  startTransition(direction) {
    if (this.isTransitioning) return;
    
    const nextSection = this.currentSection + direction;
    if (nextSection < 0 || nextSection >= this.panelData.length) return;
    
    this.transitionDirection = direction;
    this.transitionProgress = 0;
    this.isTransitioning = true;
    
    // Make sure both panels are visible for transition
    const currentPanel = this.panelData[this.currentSection].element;
    const nextPanel = this.panelData[nextSection].element;
    
    currentPanel.style.pointerEvents = 'none';
    nextPanel.style.pointerEvents = 'none';
    
    this.animateTransition();
  }
  
  animateTransition() {
    if (!this.isTransitioning || this.transitionDirection === 0) return;
    
    // Smooth transition progress
    this.transitionProgress = Math.min(1, this.transitionProgress + 0.05);
    
    this.updateTransition();
    
    if (this.transitionProgress < 1) {
      requestAnimationFrame(() => this.animateTransition());
    } else {
      this.isTransitioning = false;
    }
  }
  
  // Scroll event handling for cross-fade
  handleScroll(event) {
    const now = Date.now();
    if (now - this.lastScrollTime < 300 || this.isScrollLocked) return; // Stronger debounce
    
    this.scrollDelta += event.deltaY;
    
    // Much higher threshold for tighter control
    const threshold = 10;
    
    if (this.scrollDelta > threshold && !this.isTransitioning) {
      this.isScrollLocked = true;
      this.startTransition(1); // Next section
      this.scrollDelta = 0;
      this.lastScrollTime = now;
      setTimeout(() => { this.isScrollLocked = false; }, 600); // Lock out rapid scrolls
    } else if (this.scrollDelta < -threshold && !this.isTransitioning) {
      this.isScrollLocked = true;
      this.startTransition(-1); // Previous section
      this.scrollDelta = 0;
      this.lastScrollTime = now;
      setTimeout(() => { this.isScrollLocked = false; }, 600); // Lock out rapid scrolls
    }
  }
  
  // Touch swipe handling for cross-fade
  handleTouchStart(event) {
    this.touchStartY = event.touches[0].clientY;
  }
  
  handleTouchMove(event) {
    const now = Date.now();
    if (now - this.lastTouchTime < 500 || this.isTouchLocked) return; // Stronger debounce
    
    const touchY = event.touches[0].clientY;
    const deltaY = this.touchStartY - touchY;
    
    // Much higher threshold for tighter control
    const threshold = 110;
    
    if (Math.abs(deltaY) > threshold && !this.isTransitioning) {
      this.isTouchLocked = true;
      if (deltaY > 0) {
        this.startTransition(1); // Next section
      } else {
        this.startTransition(-1); // Previous section
      }
      this.touchStartY = touchY;
      this.lastTouchTime = now;
      setTimeout(() => { this.isTouchLocked = false; }, 600); // Lock out rapid touches
    }
  }
  
  // Keyboard navigation
  handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        event.preventDefault();
        if (!this.isTransitioning) this.startTransition(1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        event.preventDefault();
        if (!this.isTransitioning) this.startTransition(-1);
        break;
    }
  }
}
