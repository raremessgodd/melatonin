import { DOMUtils } from '../utils/DOMUtils.js';

export class BackgroundCanvasManager {
  constructor() {
    this.strip = document.getElementById('strip');
    this.canvas = document.getElementById('stripCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;
    this.img = document.getElementById('srcImg');
    
    this.tileW = 400;
    this.tileH = 140;
    
    this.init();
  }
  
  init() {
    if (!this.strip || !this.canvas || !this.ctx || !this.img) return;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Start rendering after image loads
    if (this.img.complete) {
      this.render();
    } else {
      this.img.addEventListener('load', () => this.render());
    }
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
    if (!this.strip || !this.canvas || !this.ctx || !this.img) return;
    
    const rect = this.strip.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    
    this.ctx.clearRect(0, 0, W, H);
    
    const iw = this.img.naturalWidth || 1;
    const ih = this.img.naturalHeight || 1;
    
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
    const offsetX = 0; // Example: -((performance.now()/1000)*30 % tileW)
    const offsetY = 0; // Example: -((performance.now()/1000)*10 % tileH)
    
    const startX = -extraX / 2 + offsetX;
    const startY = -extraY / 2 + offsetY;
    
    for (let r = 0; r < rows; r++) {
      const y = startY + r * this.tileH;
      for (let c = 0; c < cols; c++) {
        const x = startX + c * this.tileW;
        this.ctx.drawImage(this.img, sx, sy, sWidth, sHeight, x, y, this.tileW, this.tileH);
      }
    }
    
    requestAnimationFrame(() => this.render());
  }
}
