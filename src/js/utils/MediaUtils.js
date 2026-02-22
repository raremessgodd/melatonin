/**
 * Утилиты для работы с медиафайлами
 */

/**
 * Определяет оптимальное разрешение изображения на основе размера контейнера
 * @param {string} basePath - базовый путь к файлу (например, '/assets/img/backgrounds/mi(1).jpg')
 * @param {number} containerWidth - ширина контейнера в пикселях
 * @param {number} dpr - device pixel ratio (по умолчанию window.devicePixelRatio)
 * @returns {Object} объект с путями для src и srcset
 */
export function getResponsiveImagePaths(basePath, containerWidth = 800, dpr = window.devicePixelRatio || 1) {
  const viewportWidth = window.innerWidth;

  // Простая логика: мобильные <= 768px используют 640px, десктопы - оригинал
  const isMobile = viewportWidth <= 768;

  // Парсим путь
  const pathParts = basePath.split('.');
  const extension = pathParts.pop();
  const basePathWithoutExt = pathParts.join('.');

  // Проверяем, есть ли версии с разными разрешениями
  const hasResponsiveVersions = checkIfHasResponsiveVersions(basePath);

  if (!hasResponsiveVersions) {
    // Если нет версий с разными разрешениями, возвращаем оригинал
    return {
      src: basePath,
      srcset: null,
      sizes: null
    };
  }

  // Для мобильных - всегда 640px
  if (isMobile) {
    return {
      src: `${basePathWithoutExt}-640.${extension}`,
      srcset: null,
      sizes: null
    };
  }

  // Для десктопов - оригинал (полная версия)
  return {
    src: basePath,
    srcset: null,
    sizes: null
  };
}

/**
 * Определяет оптимальное разрешение видео
 * @param {string} basePath - базовый путь к файлу
 * @returns {string} путь к оптимальному видео
 */
export function getResponsiveVideoPath(basePath) {
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth <= 768;

  const hasResponsiveVersions = checkIfHasResponsiveVersions(basePath);

  if (!hasResponsiveVersions) {
    return basePath;
  }

  const pathParts = basePath.split('.');
  const extension = pathParts.pop();
  const basePathWithoutExt = pathParts.join('.');

  // Для мобильных - всегда 540px, для десктопов - оригинал
  if (isMobile) {
    return `${basePathWithoutExt}-540.${extension}`;
  }

  return basePath; // Оригинал для десктопов
}

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
 * Получает путь к HLS master.m3u8 для видео
 * @param {string} basePath - базовый путь к видеоресурсу (например, '/assets/video/promo_1')
 * @returns {string|null} путь к master.m3u8 или null, если HLS недоступен
 */
export function getHLSPath(basePath) {
  const fileName = basePath.split('/').pop();
  const baseName = fileName.includes('.') ? fileName.split('.').slice(0, -1).join('.') : fileName;
  return `/assets/video/hls/${baseName}/master.m3u8`;
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

/**
 * Проверяет, есть ли у файла версии с разными разрешениями
 * @param {string} basePath - путь к файлу
 * @returns {boolean}
 */
function checkIfHasResponsiveVersions(basePath) {
  // Список файлов, для которых точно есть разные разрешения
  const responsiveFiles = [
    'album_cover',
    'mi(1)_bl',
    'mi(1)_gr',
    'mi(1)_pu',
    'mi(1)_yl',
    'mi(1)',
    'motri_afisha',
    'perspektiva_afisha',
    'live_motri_1',
    'live_perspektiva_1',
    'live_perspektiva_2',
    'promo_1',
    'promo_2'
  ];

  return responsiveFiles.some(file => basePath.includes(file));
}
