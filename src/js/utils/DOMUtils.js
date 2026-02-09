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
}
