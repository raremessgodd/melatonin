/**
 * Возвращает BASE_URL, который Astro прокидывает через <meta name="base-url">.
 * При base: '/' возвращает '/'.
 * При base: '/app/' возвращает '/app/'.
 *
 * @returns {string}
 */
export function getBaseUrl() {
  const meta = document.querySelector('meta[name="base-url"]');
  return meta?.content ?? '/';
}

/**
 * Формирует корректный путь к ассету с учётом BASE_URL.
 *
 * asset('/assets/img/foo.jpg') → '/assets/img/foo.jpg'  (при base: '/')
 * asset('/assets/img/foo.jpg') → '/app/assets/img/foo.jpg' (при base: '/app/')
 *
 * @param {string} path - путь начиная со слеша, например '/assets/img/foo.jpg'
 * @returns {string}
 */
export function asset(path) {
  const base = getBaseUrl().replace(/\/$/, ''); // убираем trailing slash
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return base + cleanPath;
}

