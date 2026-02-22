/**
 * Mobile Menu Manager
 * Возвращает { destroy } для корректной очистки при View Transitions
 */
export function initMobileMenu() {
  const menuTrigger = document.getElementById('menuTrigger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuContent = mobileMenu?.querySelector('.mobile-menu__content');

  if (!menuTrigger || !mobileMenu) return { destroy: () => {} };

  let scrollPosition = 0;
  let resizeTimer = null;

  const isMenuOpen = () => menuTrigger.getAttribute('aria-expanded') === 'true';

  const handleTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  };

  const handleOverlayClick = (e) => {
    if (e.target === mobileMenu || e.target === mobileMenuContent) closeMenu();
  };

  const handleKeydown = (e) => {
    if (e.key === 'Escape' && isMenuOpen()) closeMenu();
  };

  const handleOrientationChange = () => {
    if (isMenuOpen()) closeMenu();
  };

  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 1024 && isMenuOpen()) closeMenu();
    }, 150);
  };

  menuTrigger.addEventListener('click', handleTriggerClick);
  mobileMenu.addEventListener('click', handleOverlayClick);
  mobileMenu.querySelectorAll('.mobile-menu__link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleResize);

  function toggleMenu() {
    if (isMenuOpen()) closeMenu(); else openMenu();
  }

  function openMenu() {
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.classList.add('menu-open');
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    menuTrigger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.style.visibility = 'visible';
    requestAnimationFrame(() => requestAnimationFrame(() => mobileMenu.classList.add('active')));
  }

  function closeMenu() {
    menuTrigger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.classList.add('closing');
    mobileMenu.classList.remove('active');
    setTimeout(() => {
      mobileMenu.classList.remove('closing');
      mobileMenu.style.visibility = 'hidden';
      document.body.classList.remove('menu-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo({ top: scrollPosition, left: 0, behavior: 'instant' });
    }, 400);
  }

  function destroy() {
    clearTimeout(resizeTimer);
    if (isMenuOpen()) closeMenu();
    menuTrigger.removeEventListener('click', handleTriggerClick);
    mobileMenu.removeEventListener('click', handleOverlayClick);
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleResize);
  }

  return { destroy };
}