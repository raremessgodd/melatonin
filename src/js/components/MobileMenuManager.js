export function initMobileMenu() {
  const menuTrigger = document.getElementById('menuTrigger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuContent = mobileMenu?.querySelector('.mobile-menu__content');

  if (!menuTrigger || !mobileMenu) return;

  menuTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking on the overlay (background)
  mobileMenu.addEventListener('click', (e) => {
    // Only close if clicking on the overlay itself, not the content
    if (e.target === mobileMenu) {
      closeMenu();
    }
  });

  // Prevent clicks inside menu content from closing the menu
  if (mobileMenuContent) {
    mobileMenuContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Close menu when clicking on links
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  function toggleMenu() {
    const isOpen = menuTrigger.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    menuTrigger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    menuTrigger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }
}


