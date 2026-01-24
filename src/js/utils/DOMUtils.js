export class DOMUtils {
  /**
   * Get CSS variable value in pixels
   * @param {HTMLElement} el - Element to get CSS variable from
   * @param {string} name - CSS variable name
   * @param {number} fallback - Fallback value if variable is not found
   * @returns {number} Pixel value or fallback
   */
  static cssVarPx(el, name, fallback) {
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    if (!v) return fallback;
    return v.endsWith('px') ? parseFloat(v) : fallback;
  }
  
  /**
   * Check if an element is visible in the viewport
   * @param {HTMLElement} el - Element to check
   * @returns {boolean} True if element is visible in viewport
   */
  static isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }
}
