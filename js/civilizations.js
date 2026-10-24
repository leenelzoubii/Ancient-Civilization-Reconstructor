import { CIV_ILLUSTRATIONS } from './illustrations.js';

export const CIVILIZATIONS = [];

export async function loadCivilizations() {
  const response = await fetch('/data/civilizations.json');
  const data = await response.json();
  return data.civilizations;
}

export function initializeCivilizations() {
  loadCivilizations().then(civs => {
    CIVILIZATIONS.push(...civs);
    populateHomeCards();
    populateCivilizationGrid();
    setupCivilizationSelection();
    startHeroBanner();
  });
}

/* ---------- Hero banner (rotating illustrations) ---------- */
function startHeroBanner() {
  const ids = Object.keys(CIV_ILLUSTRATIONS);
  let i = 0;
  const inner = document.getElementById('hero-banner-inner');
  if (!inner) return;
  function show() {
    inner.innerHTML = CIV_ILLUSTRATIONS[ids[i]](`hero-${ids[i]}`);
    i = (i + 1) % ids.length;
  }
  show();
  setInterval(show, 4000);
}

/* ---------- Home hero cards ---------- */
function populateHomeCards() {
  const grid = document.getElementById('home-cards');
  if (!grid) return;
  grid.innerHTML = CIVILIZATIONS.map(civ => `
    <article class="card">
      <div class="card-image">
        ${civ.image ? `<img src="${civ.image}" alt="${civ.name}" loading="lazy">` : `<div style="width:100%;height:100%;background:var(--sand);display:grid;place-items:center;color:var(--ink-3);font-size:.8rem;">${civ.name}</div>`}
      </div>
      <div class="card-body">
        <span class="era">${civ.era}</span>
        <h3>${civ.name}</h3>
        <p>${civ.overview.substring(0, 120)}...</p>
        <div class="card-actions">
          <a href="#/civ/${civ.id}" class="btn btn-sm btn-outline">View details</a>
        </div>
      </div>
    </article>
  `).join('');
}

/* ---------- Civilization grid ---------- */
function populateCivilizationGrid() {
  const grid = document.getElementById('civilization-grid');
  if (!grid) return;
  grid.innerHTML = CIVILIZATIONS.map(civ => `
    <article class="civilization-card">
      <div class="card-image">
        ${civ.image ? `<img src="${civ.image}" alt="${civ.name}" loading="lazy">` : `<div style="width:100%;height:100%;background:var(--sand);display:grid;place-items:center;color:var(--ink-3);font-size:.8rem;">${civ.name}</div>`}
      </div>
      <div class="card-body">
        <span class="era">${civ.era}</span>
        <h3>${civ.name}</h3>
        <p>${civ.overview.substring(0, 140)}...</p>
        <div class="card-tags">${(civ.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="card-actions">
          <a href="#" class="btn btn-sm btn-gold view-more" data-id="${civ.id}">Explore in 3D</a>
          <a href="#" class="btn btn-sm btn-outline" data-id="${civ.id}">View details</a>
        </div>
      </div>
    </article>
  `).join('');
}

/* ---------- Civilization selection ---------- */
function setupCivilizationSelection() {
  document.querySelectorAll('.view-more').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const civId = card.getAttribute('data-id');
      openCivilizationView(civId);
    });
  });
}

function openCivilizationView(civId) {
  const civ = CIVILIZATIONS.find(c => c.id === civId);
  if (!civ) return;

  const homeSection = document.getElementById('home-section');
  const civSection = document.getElementById('civilizations-section');
  const reconSection = document.getElementById('reconstruction-view');

  if (homeSection) homeSection.style.display = 'none';
  if (civSection) civSection.style.display = 'none';
  if (reconSection) reconSection.style.display = 'block';

  populateReconstructionView(civ);
}

function populateReconstructionView(civ) {
  const title = document.getElementById('civilization-title');
  const idEl = document.getElementById('civilization-id');
  const tagsEl = document.getElementById('civ-tags');
  const bannerEl = document.getElementById('civ-banner');

  if (title) title.textContent = civ.name;
  if (idEl) idEl.textContent = civ.id.replace(/-/g, ' ');
  if (tagsEl) tagsEl.innerHTML = (civ.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  if (bannerEl) bannerEl.innerHTML = CIV_ILLUSTRATIONS[civ.id] ? CIV_ILLUSTRATIONS[civ.id](`banner-${civ.id}`) : '';

  // Update 3D viewer (Sketchfab embed)
  const sketchfabContainer = document.getElementById('sketchfab-viewer');
  if (sketchfabContainer) {
    sketchfabContainer.innerHTML = `
      <iframe width="100%" height="450"
              src="https://sketchfab.com/models/${civ.sketchfabScene}/embed?autostart=0"
              allow="autoplay; fullscreen; vr; xr-spatial-tracking"
              allowfullscreen
              title="${civ.name} 3D Model">
      </iframe>
    `;
  }

  // Update YouTube video
  const youtubeContainer = document.getElementById('youtube-video');
  if (youtubeContainer) {
    youtubeContainer.innerHTML = `
      <iframe width="100%" height="315"
              src="https://www.youtube.com/embed/${civ.youtubeVideoId}?rel=0"
              title="${civ.name} video"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
      </iframe>
    `;
  }

  // Reset tabs
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));
  const first = document.querySelector('.tab-btn');
  if (first) first.classList.add('active');

  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(c => c.classList.remove('active'));
  const firstContent = document.getElementById('overview-tab-tab');
  if (firstContent) firstContent.classList.add('active');

  // Populate tab content
  const tabContents = {
    'overview': civ.overview,
    'history': civ.history,
    'architecture': civ.architecture,
    'daily-life': civ.dailyLife,
    'achievements': civ.achievements
  };
  const map = { 'overview': 'overview-tab-tab', 'history': 'history-tab-tab', 'architecture': 'architecture-tab-tab', 'daily-life': 'daily-life-tab-tab', 'achievements': 'achievements-tab-tab' };
  Object.entries(tabContents).forEach(([key, text]) => {
    const div = document.getElementById(map[key]);
    if (div && text) div.innerHTML = `<p>${text}</p>`;
  });

  // Tab switching
  tabs.forEach(tab => {
    tab.onclick = (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      contents.forEach(c => c.classList.remove('active'));
      const target = document.getElementById(tab.dataset.tab.replace('-tab', '-tab-tab'));
      if (target) target.classList.add('active');
    };
  });
}
