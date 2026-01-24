import { LightboxManager } from './components/LightboxManager.js';
import { BackgroundCanvasManager } from './components/BackgroundCanvasManager.js';
import { PanelTransitionManager } from './components/PanelTransitionManager.js';
import { AudioManager } from './components/AudioManager.js';
import { CarouselManager } from './components/CarouselManager.js';
import { FullscreenManager } from './components/FullscreenManager.js';

export class App {
  constructor() {
    this.lightboxManager = null;
    this.backgroundCanvasManager = null;
    this.panelTransitionManager = null;
    this.audioManager = null;
    this.carouselManager = null;
    
    this.init();
  }
  
  init() {
    // Initialize all components
    this.lightboxManager = new LightboxManager();
    this.backgroundCanvasManager = new BackgroundCanvasManager();
    this.panelTransitionManager = new PanelTransitionManager();
    this.audioManager = new AudioManager();
    this.carouselManager = new CarouselManager();
    
    // Set up global functions that are called from HTML
    window.openLightbox = (element) => this.lightboxManager.openLightbox(element);
    window.closeLightbox = () => this.lightboxManager.closeLightbox();
    window.toggleFullscreen = (element) => FullscreenManager.toggleFullscreen(element);
    window.togglePlayer = (button) => this.audioManager.togglePlayer(button);
    window.nextCarousel = () => this.carouselManager.nextCarousel();
    window.prevCarousel = () => this.carouselManager.prevCarousel();
    
    console.log('App initialized successfully');
  }
}
