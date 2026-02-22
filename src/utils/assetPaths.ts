/**
 * Возвращает корректный путь к публичному ассету с учётом BASE_URL Astro.
 *
 * Использовать в .astro-компонентах:
 *   import { asset, url } from '../utils/assetPaths';
 *   <img src={asset('/assets/img/icons/ico.jpg')} />
 *   <a href={url('/about')}>About</a>
 *
 * При base: '/'    → asset('/assets/img/foo.jpg') === '/assets/img/foo.jpg'
 * При base: '/app/'→ asset('/assets/img/foo.jpg') === '/app/assets/img/foo.jpg'
 */

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Путь к статическому ассету из /public.
 * @param path - абсолютный путь начиная со слеша, например '/assets/img/foo.jpg'
 */
export function asset(path: string): string {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return base + cleanPath;
}

/**
 * Путь к внутренней странице сайта.
 * @param path - абсолютный путь начиная со слеша, например '/about'
 */
export function url(path: string): string {
  if (path === '/') return import.meta.env.BASE_URL;
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return base + cleanPath;
}

