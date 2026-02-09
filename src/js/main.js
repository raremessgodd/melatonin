import { App } from './App.js';
import { initMobileMenu } from './components/MobileMenuManager.js';

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('is-loaded');
  initMobileMenu();
  new App();
});
