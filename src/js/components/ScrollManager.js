export class ScrollManager {
    constructor() {
        this.h1Element = document.getElementById('scroll-to-top');
        this.scrollToTop = this.scrollToTop.bind(this);

        // Add event listeners
        if (this.h1Element) {
          this.h1Element.addEventListener('click', this.scrollToTop);
        }
    }

    scrollToTop() {
        // Скроллим страницу в самый верх
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}
