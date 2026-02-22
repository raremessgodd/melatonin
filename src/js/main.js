import { App } from './App.js';
import { initMobileMenu } from './components/MobileMenuManager.js';

let currentApp = null;
let currentMenu = null;

function initApp() {
  // Применяем page-specific классы (например 'subpage')
  const extraClass = document.body.dataset.bodyClass;
  if (extraClass) document.body.classList.add(...extraClass.split(' ').filter(Boolean));
  document.body.classList.add('is-loaded');

  currentMenu = initMobileMenu();
  currentApp = new App();
}

function destroyApp() {
  // Убираем page-specific и состоянные классы
  const extraClass = document.body.dataset.bodyClass;
  if (extraClass) document.body.classList.remove(...extraClass.split(' ').filter(Boolean));
  document.body.classList.remove('is-bg-ready', 'is-text-ready', 'is-media-ready', 'is-loaded');

  currentApp?.destroy();
  currentMenu?.destroy();
  currentApp = null;
  currentMenu = null;
}

// astro:before-swap — DOM ещё старый, чистим менеджеры
document.addEventListener('astro:before-swap', destroyApp);
// astro:page-load — новый DOM готов (body уже заменён, is-booting стоит из HTML)
document.addEventListener('astro:page-load', initApp);
