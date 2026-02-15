/**
 * Björk-Style Mobile Menu Manager
 * Minimalist fullscreen menu with smooth animations
 */
export function initMobileMenu() {
  const menuTrigger = document.getElementById('menuTrigger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuContent = mobileMenu?.querySelector('.mobile-menu__content');

  // Переменная для сохранения позиции скролла
  let scrollPosition = 0;

  if (!menuTrigger || !mobileMenu) return;

  // Toggle menu on trigger click
  menuTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking on overlay background
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu || e.target === mobileMenuContent) {
      closeMenu();
    }
  });

  // Close menu when clicking on any link
  const menuLinks = mobileMenu.querySelectorAll('.mobile-menu__link');
  menuLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuTrigger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  // Prevent scroll on body when menu is open
  function toggleMenu() {
    const isOpen = menuTrigger.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    // Сохраняем текущую позицию прокрутки
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    // Блокируем прокрутку body
    document.body.classList.add('menu-open');
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    // Set ARIA states
    menuTrigger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');

    // Make menu visible
    mobileMenu.style.visibility = 'visible';

    // Trigger animation with RAF for smooth transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mobileMenu.classList.add('active');
      });
    });
  }

  function closeMenu() {
    // Set ARIA states
    menuTrigger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');

    // Add closing class for exit animation
    mobileMenu.classList.add('closing');
    mobileMenu.classList.remove('active');

    // Wait for animation to complete
    setTimeout(() => {
      mobileMenu.classList.remove('closing');
      mobileMenu.style.visibility = 'hidden';

      // Восстанавливаем прокрутку и позицию
      document.body.classList.remove('menu-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // Восстанавливаем сохранённую позицию скролла МГНОВЕННО (без анимации)
      window.scrollTo({
        top: scrollPosition,
        left: 0,
        behavior: 'instant' // Мгновенно, без плавной прокрутки
      });
    }, 400); // Match CSS transition duration
  }

  // Handle orientation change - close menu
  window.addEventListener('orientationchange', () => {
    if (menuTrigger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  // Close menu on window resize (desktop/mobile switch)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 1024 && menuTrigger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    }, 150);
  });
}