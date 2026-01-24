export class CarouselManager {
  constructor() {
    this.currentCarouselIndex = 0;
    this.carouselItems = document.querySelectorAll('.carousel-item');
    this.carouselContainer = document.querySelector('.carousel-container');
    
    // Touch handling variables
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isTouching = false;
    
    // Bind methods to preserve 'this' context
    this.showCarouselItem = this.showCarouselItem.bind(this);
    this.nextCarousel = this.nextCarousel.bind(this);
    this.prevCarousel = this.prevCarousel.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    
    this.init();
  }
  
  init() {
    // Add touch event listeners if carousel container exists
    if (this.carouselContainer) {
      this.carouselContainer.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      this.carouselContainer.addEventListener('touchmove', this.handleTouchMove, { passive: true });
      this.carouselContainer.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
  }
  
  handleTouchStart(event) {
    this.isTouching = true;
    this.touchStartX = event.touches[0].clientX;
  }
  
  handleTouchMove(event) {
    if (!this.isTouching) return;
    this.touchEndX = event.touches[0].clientX;
  }
  
  handleTouchEnd() {
    if (!this.isTouching) return;
    
    this.isTouching = false;
    
    // Calculate swipe distance
    const swipeDistance = this.touchStartX - this.touchEndX;
    const minSwipeDistance = 50; // Minimum distance for a valid swipe
    
    // Swipe left - next slide
    if (swipeDistance > minSwipeDistance) {
      this.nextCarousel();
    }
    // Swipe right - previous slide
    else if (swipeDistance < -minSwipeDistance) {
      this.prevCarousel();
    }
    
    // Reset touch positions
    this.touchStartX = 0;
    this.touchEndX = 0;
  }
  
  showCarouselItem(index) {
    // Hide all items
    this.carouselItems.forEach(item => item.classList.remove('active'));
    
    // Show the selected item
    if (this.carouselItems[index]) {
      this.carouselItems[index].classList.add('active');
    }
    
    // Update current index
    this.currentCarouselIndex = index;
  }
  
  nextCarousel() {
    if (this.carouselItems.length === 0) return;
    
    const nextIndex = (this.currentCarouselIndex + 1) % this.carouselItems.length;
    this.showCarouselItem(nextIndex);
  }
  
  prevCarousel() {
    if (this.carouselItems.length === 0) return;
    
    const prevIndex = (this.currentCarouselIndex - 1 + this.carouselItems.length) % this.carouselItems.length;
    this.showCarouselItem(prevIndex);
  }
}
