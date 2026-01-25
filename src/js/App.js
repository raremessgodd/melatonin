import { LightboxManager } from './components/LightboxManager.js';
import { PanelTransitionManager } from './components/PanelTransitionManager.js';
import { AudioManager } from './components/AudioManager.js';
import { FullscreenManager } from './components/FullscreenManager.js';
import { ScrollManager } from './components/ScrollManager.js'

export class App {
  constructor() {
    this.lightboxManager = null;
    this.panelTransitionManager = null;
    this.audioManager = null;
    this.scrollManager = null;
    
    this.init();
  }
  
  init() {
    // Initialize all components
    this.lightboxManager = new LightboxManager();
    // PanelTransitionManager now handles BackgroundCanvasManager internally
    this.panelTransitionManager = new PanelTransitionManager();
    this.audioManager = new AudioManager();
    this.scrollManager = new ScrollManager();
    
    // Set up global functions that are called from HTML
    window.openLightbox = (element) => this.lightboxManager.openLightbox(element);
    window.closeLightbox = () => this.lightboxManager.closeLightbox();
    window.toggleFullscreen = (element) => FullscreenManager.toggleFullscreen(element);
    window.togglePlayer = (button) => this.audioManager.togglePlayer(button);
    
    console.log('App initialized successfully');
  }
}
