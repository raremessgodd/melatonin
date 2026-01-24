export class LightboxManager {
  constructor() {
    this.lightbox = document.getElementById('lightbox');
    this.lightboxImg = document.getElementById('lightbox-img');
    
    // Bind methods to preserve 'this' context
    this.openLightbox = this.openLightbox.bind(this);
    this.closeLightbox = this.closeLightbox.bind(this);
    
    // Add event listeners
    if (this.lightbox) {
      this.lightbox.addEventListener('click', this.closeLightbox);
    }
  }
  
  openLightbox(element) {
    const img = element.querySelector('img');
    if (!img || !this.lightbox || !this.lightboxImg) return;
    
    this.lightboxImg.src = img.src;
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  closeLightbox() {
    if (!this.lightbox) return;
    
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}
