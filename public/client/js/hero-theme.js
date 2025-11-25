// Hero Theme - Dark animated globe version
function initHeroTheme() {
  const heroBreathe = document.getElementById('hero-breathing');
  if (!heroBreathe) return;

  // Randomly set initial AQI status for dark theme
  const statuses = ['good', 'moderate', 'unhealthy-for-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'];
  const initialStatus = statuses[Math.floor(Math.random() * statuses.length)];
  heroBreathe.setAttribute('data-aqi-status', initialStatus);

  // Add 3D perspective for globe animation
  heroBreathe.style.perspective = '1000px';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroTheme);
} else {
  initHeroTheme();
}

