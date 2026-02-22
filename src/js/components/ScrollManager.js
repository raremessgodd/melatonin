export class ScrollManager {
    constructor() {
        this.h1Element = document.getElementById('scroll-to-top');
        this.scrollToTop = this.scrollToTop.bind(this);

        if (this.h1Element) {
          this.h1Element.addEventListener('click', this.scrollToTop);
        }
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    destroy() {
        if (this.h1Element) {
          this.h1Element.removeEventListener('click', this.scrollToTop);
        }
    }
}
