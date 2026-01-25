import { DOMUtils } from '../utils/DOMUtils.js';

export class BackgroundCanvasManager {
  constructor(canvas, imageSrc, strip) {
    this.strip = strip || document.getElementById('strip');
    this.canvas = canvas;
    this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;
    this.img = null;
    this.imageSrc = imageSrc;
    
    this.tileW = 400;
    this.tileH = 140;
    this.isRendering = false;
    this.animationFrame = null;
    
    this.init();
  }
  
  init() {
    if (!this.strip || !this.canvas || !this.ctx || !this.imageSrc) return;
    
    // Create image element
    this.img = new Image();
    this.img.crossOrigin = 'anonymous';
    
    this.img.onload = () => {
      this.resize();
      this.render();
    };
    
    this.img.onerror = () => {
      console.error('Failed to load image:', this.imageSrc);
    };
    
    this.img.src = this.imageSrc;
    
    window.addEventListener('resize', () => {
      if (this.img && this.img.complete) {
        this.resize();
      }
    });
  }
  
  resize() {
    if (!this.strip || !this.canvas || !this.ctx) return;
    
    this.tileW = DOMUtils.cssVarPx(this.strip, '--tile-w', 400);
    this.tileH = DOMUtils.cssVarPx(this.strip, '--tile-h', 140);
    
    const rect = this.strip.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    
    // Draw in CSS pixels
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  
  render() {
    if (!this.strip || !this.canvas || !this.ctx || !this.img || !this.img.complete) {
      if (this.isRendering) {
        this.animationFrame = requestAnimationFrame(() => this.render());
      }
      return;
    }
    
    const rect = this.strip.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    
    if (W === 0 || H === 0) {
      if (this.isRendering) {
        this.animationFrame = requestAnimationFrame(() => this.render());
      }
      return;
    }
    
    this.ctx.clearRect(0, 0, W, H);
    
    const iw = this.img.naturalWidth || 1;
    const ih = this.img.naturalHeight || 1;
    
    if (iw === 0 || ih === 0) {
      if (this.isRendering) {
        this.animationFrame = requestAnimationFrame(() => this.render());
      }
      return;
    }
    
    // object-fit: cover for one tile
    const tileAR = this.tileW / this.tileH;
    const imgAR = iw / ih;
    
    let sx = 0;
    let sy = 0;
    let sWidth = iw;
    let sHeight = ih;
    
    if (imgAR > tileAR) {
      // Image wider than tile -> crop width
      sHeight = ih;
      sWidth = Math.round(ih * tileAR);
      sx = Math.round((iw - sWidth) / 2);
    } else {
      // Image taller than tile -> crop height
      sWidth = iw;
      sHeight = Math.round(iw / tileAR);
      sy = Math.round((ih - sHeight) / 2);
    }
    
    const cols = Math.ceil(W / this.tileW) + 2;
    const rows = Math.ceil(H / this.tileH) + 2;
    
    // Symmetric overflow on edges
    const extraX = cols * this.tileW - W;
    const extraY = rows * this.tileH - H;
    
    // Movement if needed
    const offsetX = 0;
    const offsetY = 0;
    
    const startX = -extraX / 2 + offsetX;
    const startY = -extraY / 2 + offsetY;
    
    for (let r = 0; r < rows; r++) {
      const y = startY + r * this.tileH;
      for (let c = 0; c < cols; c++) {
        const x = startX + c * this.tileW;
        this.ctx.drawImage(this.img, sx, sy, sWidth, sHeight, x, y, this.tileW, this.tileH);
      }
    }
    
    // Only continue rendering if this is the active canvas and we need to check for resize
    if (this.isRendering) {
      this.animationFrame = requestAnimationFrame(() => this.render());
    }
  }
  
  startRendering() {
    if (!this.isRendering) {
      this.isRendering = true;
      if (this.img && this.img.complete) {
        this.render();
      }
    }
  }
  
  stopRendering() {
    this.isRendering = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  changeImage(newImageSrc) {
    if (newImageSrc === this.imageSrc) return;
    
    this.imageSrc = newImageSrc;
    this.img = new Image();
    this.img.crossOrigin = 'anonymous';
    
    this.img.onload = () => {
      this.resize();
      this.render();
    };
    
    this.img.onerror = () => {
      console.error('Failed to load image:', newImageSrc);
    };
    
    this.img.src = newImageSrc;
  }
}
