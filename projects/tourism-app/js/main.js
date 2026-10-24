import { initializeCivilizations } from './civilizations.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeCivilizations();

  // Navigation between sections
  const navLinks = document.querySelectorAll('nav a, .back');
  const sectionIds = ['home-section', 'civilizations-section', 'reconstruction-view', 'about-section', 'contact-section'];

  // Show initial home section
  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('home-section').style.display = 'block';

  function showSection(targetId) {
    // Hide all sections
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    // Show target section
    const targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.style.display = 'block';
    // Update nav active state
    navLinks.forEach(l => l.classList.remove('active'));
    const active = document.querySelector(`a[href="#${targetId}"]`);
    if (active) active.classList.add('active');
    window.scrollTo(0, 0);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      showSection(targetId);
    });
  });

  // Close buttons or back functionality
  document.querySelectorAll('.close-section').forEach(btn => {
    btn.addEventListener('click', () => {
      showSection('home-section');
    });
  });
});
