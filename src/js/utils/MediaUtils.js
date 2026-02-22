/**
 * Утилиты для работы с медиафайлами
 */

// Используем сочетание coarse pointer и touch, чтобы не считать узкие десктопные окна мобильными.
export function isMobileDevice() {
  if (window.matchMedia) {
    const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (coarsePointer) return true;
  }

  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const touchCapable = 'ontouchstart' in window || maxTouchPoints > 0;
  return touchCapable && window.innerWidth <= 768;
}

/**
 * Получает путь к максимальному качеству медиафайла
 * @param {string} basePath - базовый путь к файлу
 * @returns {string} путь к файлу максимального качества
 */
export function getMaxQualityPath(basePath) {
  // Возвращаем оригинальный путь (без суффикса разрешения)
  return basePath.replace(/-\d+\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i, '.$1');
}
