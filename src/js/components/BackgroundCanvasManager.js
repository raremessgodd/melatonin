import { DOMUtils } from '../utils/DOMUtils.js';

export class BackgroundCanvasManager {
  static imageCache = new Map();

  static loadImage(src) {
    if (BackgroundCanvasManager.imageCache.has(src)) {
      return BackgroundCanvasManager.imageCache.get(src);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (img.decode) {
          img.decode().catch(() => {}).finally(() => resolve(img));
        } else {
          resolve(img);
        }
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });

    BackgroundCanvasManager.imageCache.set(src, promise);
    return promise;
  }

  constructor(canvas, imageSrc, strip) {
    this.strip = strip || document.getElementById('strip');
    this.canvas = canvas;
    this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;
    this.img = null;
    this.imageSrc = imageSrc;
    
    this.tileW = 400;
    this.tileH = 140;
    this.animationFrame = null;
    this.pendingRender = false;
    
    this.init();
  }
  
  init() {
    if (!this.strip || !this.canvas || !this.ctx || !this.imageSrc) return;
    
    this.setImage(this.imageSrc);
    
    window.addEventListener('resize', () => {
      if (this.img && this.img.complete) {
        this.resize();
      }
    });
  }

  setImage(src) {
    BackgroundCanvasManager.loadImage(src)
      .then((img) => {
        this.img = img;
        this.resize();
        this.scheduleRender();
      })
      .catch((error) => {
        console.error(error);
      });
  }
  
  resize() {
    if (!this.strip || !this.canvas || !this.ctx) return;
    
    this.tileW = DOMUtils.cssVarPx(this.strip, '--tile-w', 400);
    this.tileH = DOMUtils.cssVarPx(this.strip, '--tile-h', 140);
    
    const rect = this.strip.getBoundingClientRect();
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = connection && connection.saveData;
    const effectiveType = connection && connection.effectiveType ? connection.effectiveType : '';
    const isSlow = effectiveType === '2g' || effectiveType === 'slow-2g';
    const dpr = saveData || isSlow ? 1 : Math.max(1, window.devicePixelRatio || 1);
    
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    
    // Draw in CSS pixels
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scheduleRender();
  }
  
  render() {
    if (!this.strip || !this.canvas || !this.ctx || !this.img || !this.img.complete) return;
    
    const rect = this.strip.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    
    if (W === 0 || H === 0) return;
    
    this.ctx.clearRect(0, 0, W, H);
    
    const iw = this.img.naturalWidth || 1;
    const ih = this.img.naturalHeight || 1;
    
    if (iw === 0 || ih === 0) return;
    
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
    
  }
  
  scheduleRender() {
    if (this.pendingRender) return;
    this.pendingRender = true;
    this.animationFrame = requestAnimationFrame(() => {
      this.pendingRender = false;
      this.render();
    });
  }
  
  startRendering() {
    this.scheduleRender();
  }
  
  stopRendering() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.pendingRender = false;
  }
  
  changeImage(newImageSrc) {
    if (newImageSrc === this.imageSrc) {
      return Promise.resolve(true);
    }
    
    this.imageSrc = newImageSrc;
    return BackgroundCanvasManager.loadImage(newImageSrc)
      .then((img) => {
        this.img = img;
        this.resize();
        this.scheduleRender();
        return true;
      })
      .catch((error) => {
        console.error(error);
        return false;
      });
  }
}
