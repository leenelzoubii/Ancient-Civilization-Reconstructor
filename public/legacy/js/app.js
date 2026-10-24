/* =====================================================================
   Ancient Civilization Reconstructor — Application
   Single-page app with hash routing (works by opening index.html).
   ===================================================================== */
(function () {
  'use strict';

  const DATA = window.CIV_DATA, ORDER = window.CIV_ORDER, SCENES = window.CIV_SCENES, ART = window.ILLUSTRATIONS;
  const app = document.getElementById('app');
  const SECTIONS = ['overview', 'history', 'architecture', 'dailylife', 'achievements'];

  /* ---------- Utilities ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = {
    arrowL: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    rotate: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.2-8.6"/><path d="M21 3v6h-6"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    vr: '<svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-2-3h-2l-2 3H5a2 2 0 0 1-2-2z"/><circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3v4M17 5h4"/></svg>',
    cube: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>',
    save: '<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
    bigArrow: '<svg viewBox="0 0 48 48"><path d="M8 24h30M28 14l10 10-10 10"/></svg>'
  };

  /* Session storage (Save / Exit session in the flowchart) */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('acr.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('acr.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  function remember(patch) { store.set('session', Object.assign(store.get('session', { visited: [] }), patch)); }
  function markVisited(id) { const s = store.get('session', { visited: [] }); if (!s.visited.includes(id)) s.visited.push(id); s.lastCiv = id; s.when = Date.now(); store.set('session', s); }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- Router ---------- */
  let cleanup = null;
  const routes = [
    [/^\/?$/, viewHome, 'home'],
    [/^\/civilizations$/, viewCivilizations, 'civilizations'],
    [/^\/civ\/(\w+)$/, viewReconstruction, 'civilizations'],
    [/^\/civ\/(\w+)\/info(?:\/(\w+))?$/, viewInfo, 'civilizations'],
    [/^\/reconstruct$/, viewReconstruct, 'reconstruct'],
    [/^\/reconstruct\/result$/, viewResult, 'reconstruct'],
    [/^\/about$/, viewAbout, 'about']
  ];
  function route() {
    const path = (location.hash || '#/').slice(1);
    if (cleanup) { try { cleanup(); } catch (e) { } cleanup = null; }
    for (const [re, fn, nav] of routes) {
      const m = path.match(re);
      if (m) {
        $$('.primary-nav > a').forEach(a => { a.classList.toggle('active', a.dataset.nav === nav); a.toggleAttribute('aria-current', a.dataset.nav === nav); });
        app.innerHTML = '';
        const r = fn(...m.slice(1));
        if (r === false) return;
        app.firstElementChild && app.firstElementChild.classList.add('fade-in');
        window.scrollTo(0, 0);
        closeMenu();
        return;
      }
    }
    location.hash = '#/';
  }
  window.addEventListener('hashchange', route);

  function setTitle(t) { document.title = t ? `${t} — Ancient Civilization Reconstructor` : 'Ancient Civilization Reconstructor'; }

  /* ---------- Shared pieces ---------- */
  function civCard(id, detailed) {
    const c = DATA[id];
    const visited = store.get('session', { visited: [] }).visited.includes(id);
    return `
      <article class="civ-card" style="--accent:${c.accent}">
        ${visited ? '<span class="badge">Visited</span>' : ''}
        <div class="art">${ART[id](id + (detailed ? 'd' : 'c'))}</div>
        <div class="body">
          <span class="era">${esc(c.era)}</span>
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.tagline)}.</p>
          ${detailed ? `<dl class="meta"><dt>Region</dt><dd>${esc(c.region)}</dd><dt>Language</dt><dd>${esc(c.language)}</dd></dl>` : ''}
          <div class="actions">
            <a class="btn btn-primary btn-sm" href="#/civ/${id}">${icon.cube} View in 3D</a>
            <a class="btn btn-outline btn-sm" href="#/civ/${id}/info/overview">Learn more</a>
          </div>
        </div>
      </article>`;
  }

  function featureBanner() {
    return `
      <section class="feature-banner">
        <div>${ART.artifact()}</div>
        <div>
          <span class="tag">NEW FEATURE</span>
          <h3>AI Artifact Reconstruction</h3>
          <p>Upload a photo of a broken artifact and the AI estimates how the complete piece may have looked — using symmetry analysis and reference images.</p>
        </div>
        <div><a class="btn btn-gold" href="#/reconstruct">${icon.sparkle} Try it now</a></div>
      </section>`;
  }

  /* ================================================================ */
  /* 1. HOME                                                          */
  /* ================================================================ */
  function viewHome() {
    setTitle('');
    const s = store.get('session', { visited: [] });
    app.innerHTML = `
      <div>
        <section class="hero">
          <div class="container hero-inner">
            <div>
              <span class="eyebrow">Explore · Learn · Reconstruct</span>
              <h1>Step inside the worlds of <em>ancient civilizations</em></h1>
              <p class="lead">Walk around digital reconstructions of Ancient Egypt, Rome and the Maya, discover how people lived, and use AI to imagine how broken artifacts once looked.</p>
              <div class="hero-actions">
                <a class="btn btn-gold" href="#/civilizations">Explore now ${icon.arrowR}</a>
                <a class="btn btn-light" href="#/reconstruct">${icon.sparkle} Reconstruct an artifact</a>
              </div>
              <div class="hero-stats">
                <div><strong>3</strong><span>Civilizations</span></div>
                <div><strong>16</strong><span>3D landmarks</span></div>
                <div><strong>4,800</strong><span>Years of history</span></div>
              </div>
            </div>
            <div class="hero-collage" aria-hidden="true">
              <figure class="c1">${ART.egypt('h1')}<figcaption>Giza, Egypt</figcaption></figure>
              <figure class="c2">${ART.rome('h2')}<figcaption>Rome, Italy</figcaption></figure>
              <figure class="c3">${ART.maya('h3')}<figcaption>Chichén Itzá, Mexico</figcaption></figure>
            </div>
          </div>
        </section>
        ${s.lastCiv && DATA[s.lastCiv] ? `
        <div class="container"><div class="resume">
          <span>Welcome back! Continue exploring <strong>${esc(DATA[s.lastCiv].name)}</strong>.</span>
          <a class="btn btn-gold btn-sm" href="#/civ/${s.lastCiv}">Resume ${icon.arrowR}</a>
        </div></div>` : ''}
        <section class="section">
          <div class="container">
            <div class="section-title">
              <div><span class="eyebrow">Choose a civilization</span><h2>Where would you like to travel?</h2></div>
              <a class="btn btn-outline btn-sm" href="#/civilizations">All civilizations ${icon.arrowR}</a>
            </div>
            <div class="civ-grid">${ORDER.map(id => civCard(id)).join('')}</div>
            ${featureBanner()}
          </div>
        </section>
        <section class="section" style="padding-top:0">
          <div class="container">
            <div class="section-title"><div><span class="eyebrow">How it works</span><h2>Learning through reconstruction</h2></div></div>
            <div class="steps-row">
              <div class="step-card"><h3>Choose</h3><p>Select a civilization — Ancient Egypt, Rome or the Maya.</p></div>
              <div class="step-card"><h3>Explore in 3D</h3><p>Rotate and zoom around a reconstructed city and jump to its most important landmarks.</p></div>
              <div class="step-card"><h3>Learn</h3><p>Read about history, architecture, daily life and achievements, with timelines and key facts.</p></div>
              <div class="step-card"><h3>Reconstruct</h3><p>Upload a broken artifact and let the AI estimate how it looked when it was complete.</p></div>
            </div>
          </div>
        </section>
      </div>`;
  }

  /* ================================================================ */
  /* 2. CIVILIZATION SELECTION                                        */
  /* ================================================================ */
  function viewCivilizations() {
    setTitle('Select a Civilization');
    app.innerHTML = `
      <div class="container">
        <div class="page-head">
          <span class="eyebrow">Civilizations</span>
          <h1>Select a Civilization</h1>
          <p class="lead">Each civilization includes an interactive 3D reconstruction and a guide to its history, architecture, daily life and achievements.</p>
        </div>
        <div class="civ-grid">${ORDER.map(id => civCard(id, true)).join('')}</div>
        ${featureBanner()}
        <div style="height:56px"></div>
      </div>`;
  }

  /* ================================================================ */
  /* 3. RECONSTRUCTION VIEW (3D)                                      */
  /* ================================================================ */
  function viewReconstruction(id) {
    const c = DATA[id], sc = SCENES[id];
    if (!c) { location.hash = '#/civilizations'; return false; }
    setTitle(c.name + ' — 3D Reconstruction');
    markVisited(id);
    app.innerHTML = `
      <div class="container" style="--accent:${c.accent}">
        <div class="page-head" style="padding-bottom:20px">
          <a class="back" href="#/civilizations">${'←'} Back to civilizations</a>
          <span class="eyebrow">${esc(c.era)}</span>
          <h1 style="margin:0">${esc(c.name)}</h1>
        </div>
        <div class="view-layout">
          <div>
            <div class="viewer-wrap">
              <div class="viewer" id="viewer" style="background:${sc.sky}">
                <div class="viewer-hint" id="hint">${matchMedia('(pointer: coarse)').matches ? 'Drag to rotate · Pinch to zoom' : 'Drag to rotate · Scroll to zoom · Shift + drag to pan'}</div>
                <div class="marker-layer" id="markers"></div>
                <div class="viewer-ui">
                  <button class="icon-btn" data-act="vr" title="VR / walk-in view" aria-label="Enter VR or walk-in view">${icon.vr}</button>
                  <button class="icon-btn" data-act="in" title="Zoom in" aria-label="Zoom in">${icon.plus}</button>
                  <button class="icon-btn" data-act="out" title="Zoom out" aria-label="Zoom out">${icon.minus}</button>
                  <button class="icon-btn" data-act="reset" title="Reset view" aria-label="Reset view">${icon.reset}</button>
                  <button class="icon-btn" data-act="spin" title="Auto-rotate" aria-label="Auto-rotate" aria-pressed="false">${icon.rotate}</button>
                  <button class="icon-btn" data-act="shot" title="Save screenshot" aria-label="Save screenshot">${icon.camera}</button>
                  <button class="icon-btn" data-act="full" title="Full screen" aria-label="Full screen">${icon.full}</button>
                </div>
                <div class="viewer-title">${esc(sc.title)}</div>
              </div>
              <div class="poi-bar">
                <button class="nav-arrow" data-poi="prev" aria-label="Previous landmark">${icon.arrowL}</button>
                <div class="poi-text" aria-live="polite">
                  <h3 id="poi-name"></h3>
                  <p id="poi-text"></p>
                  <div class="poi-dots" id="poi-dots"></div>
                </div>
                <button class="nav-arrow" data-poi="next" aria-label="Next landmark">${icon.arrowR}</button>
              </div>
            </div>
            <div class="vr-cta">
              <div><strong>Step inside in VR</strong><span>Stand at eye level beside each landmark — with a VR headset, a phone VR viewer, or no headset at all.</span></div>
              <button class="btn btn-gold" id="vr-open">${icon.vr} Enter VR</button>
            </div>
          </div>
          <aside class="side-panel">
            <h3>Information</h3>
            <ul>${SECTIONS.map(s => `<li><a href="#/civ/${id}/info/${s}">${c.sections[s].title}</a></li>`).join('')}</ul>
            <dl>
              <div><dt>Period</dt><dd>${esc(c.era)}</dd></div>
              <div><dt>Region</dt><dd>${esc(c.region)}</dd></div>
              <div><dt>Major cities</dt><dd>${esc(c.capitals)}</dd></div>
              <div><dt>Language</dt><dd>${esc(c.language)}</dd></div>
            </dl>
            <div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap">
              ${ORDER.filter(o => o !== id).map(o => `<a class="btn btn-outline btn-sm" href="#/civ/${o}">${esc(DATA[o].name)}</a>`).join('')}
            </div>
          </aside>
        </div>
      </div>`;

    const host = $('#viewer');
    let viewer;
    try {
      viewer = new Engine3D.Viewer(host, sc);
    } catch (err) {
      host.insertAdjacentHTML('beforeend', `<div class="viewer-fallback"><div class="box"><h3>3D view unavailable</h3><p class="muted">Your browser or device doesn't support WebGL, so the 3D reconstruction can't be shown. You can still read all the information about ${esc(c.name)}.</p><a class="btn btn-primary btn-sm" href="#/civ/${id}/info/overview">Read the guide</a></div></div>`);
      $('.viewer-ui', host).remove(); $('#hint').remove();
      renderPoiText();
      return;
    }
    const startView = { target: sc.camera.target, theta: sc.camera.theta, phi: sc.camera.phi, radius: sc.camera.radius };
    let current = -1;
    const markerLayer = $('#markers');
    sc.pois.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'marker';
      b.innerHTML = `${i + 1}<span class="label">${esc(p.name)}</span>`;
      b.setAttribute('aria-label', `Landmark ${i + 1}: ${p.name}`);
      b.addEventListener('click', () => go(i));
      markerLayer.appendChild(b);
      viewer.addMarker(b, p.pos);
    });
    $('#poi-dots').innerHTML = sc.pois.map((p, i) => `<button aria-label="${esc(p.name)}" data-i="${i}"></button>`).join('');
    $$('#poi-dots button').forEach(b => b.addEventListener('click', () => go(+b.dataset.i)));

    function renderPoiText() {
      const p = sc.pois[current];
      $('#poi-name').textContent = p ? `${current + 1}. ${p.name}` : 'Explore the reconstruction';
      $('#poi-text').textContent = p ? p.text : `Use the arrows or the numbered markers to visit ${sc.pois.length} key landmarks of ${c.name}. Drag the scene to look around.`;
      $$('#poi-dots button').forEach((b, i) => b.classList.toggle('active', i === current));
      $$('.marker').forEach((b, i) => b.classList.toggle('active', i === current));
    }
    function go(i) {
      current = (i + sc.pois.length) % sc.pois.length;
      viewer.orbit.flyTo(sc.pois[current].view);
      renderPoiText();
      remember({ lastPoi: current });
    }
    renderPoiText();
    $$('[data-poi]').forEach(b => b.addEventListener('click', () => go(current + (b.dataset.poi === 'next' ? 1 : -1))));
    viewer.orbit.userActed = () => { const h = $('#hint'); if (h) h.style.opacity = 0; };

    $$('.viewer-ui [data-act]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'in') viewer.orbit.zoom(0.8);
      if (a === 'out') viewer.orbit.zoom(1.25);
      if (a === 'reset') { viewer.orbit.flyTo(startView); current = -1; renderPoiText(); }
      if (a === 'spin') { viewer.orbit.autoRotate = !viewer.orbit.autoRotate; b.setAttribute('aria-pressed', viewer.orbit.autoRotate); }
      if (a === 'shot') {
        const shot = document.createElement('canvas');
        shot.width = viewer.canvas.width; shot.height = viewer.canvas.height;
        const g = shot.getContext('2d');
        const grd = g.createLinearGradient(0, 0, 0, shot.height);
        const cols = sc.sky.match(/#[0-9a-f]{6}/gi) || ['#ccc', '#eee'];
        cols.forEach((col, i) => grd.addColorStop(i / (cols.length - 1), col));
        g.fillStyle = grd; g.fillRect(0, 0, shot.width, shot.height);
        const img = new Image();
        img.onload = () => { g.drawImage(img, 0, 0); download(shot.toDataURL('image/png'), `${id}-reconstruction.png`); toast('Screenshot saved'); };
        img.src = viewer.snapshot();
      }
      if (a === 'vr') openVrChooser();
      if (a === 'full') {
        const el = $('.viewer-wrap');
        if (document.fullscreenElement) document.exitFullscreen();
        else if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('Full screen is not available here'));
      }
    }));
    const onFs = () => { host.style.height = document.fullscreenElement ? 'calc(100vh - 110px)' : ''; };
    document.addEventListener('fullscreenchange', onFs);
    /* ---- VR / walk-in ---- */
    let vrSession = null;
    $('#vr-open').addEventListener('click', openVrChooser);
    async function openVrChooser() {
      const xr = await VRMode.xrSupported();
      const touch = matchMedia('(pointer: coarse)').matches;
      const secure = window.isSecureContext;
      const dlg = document.createElement('dialog');
      dlg.className = 'vr-dialog';
      dlg.innerHTML = `
        <form method="dialog">
          <div class="vr-dialog-head"><h2>Step inside ${esc(c.name)}</h2><button value="cancel" class="vr-close" aria-label="Close">✕</button></div>
          <p class="muted">You will stand at eye level at real-world scale and travel between the ${sc.pois.length} landmarks.</p>
          <div class="vr-options">
            <button value="xr" class="vr-opt" ${xr ? '' : 'disabled'}>
              <span class="vr-ico">${icon.vr}</span>
              <span><strong>VR headset</strong><small>${xr ? 'Meta Quest, Pico and other WebXR headsets. Trigger = next landmark, thumbsticks = walk and turn.' : 'No VR headset detected. Open this website in your headset\'s browser (e.g. Meta Quest Browser) to use this option.'}</small></span>
            </button>
            <button value="stereo" class="vr-opt">
              <span class="vr-ico">${icon.camera}</span>
              <span><strong>Phone VR viewer</strong><small>${touch ? 'Split screen for Google Cardboard-style viewers. Turn your head to look around; tap to move to the next landmark.' : 'Best on a phone placed in a Cardboard-style viewer. On a computer you can still preview the split-screen view.'}</small></span>
            </button>
            <button value="mono" class="vr-opt">
              <span class="vr-ico">${icon.cube}</span>
              <span><strong>Walk-in view (no headset)</strong><small>Full-screen first-person view. Drag to look around, W A S D to walk, ← → to change landmark.</small></span>
            </button>
          </div>
          ${secure ? '' : '<p class="vr-note">Tip: VR headsets and phone motion sensors only work when the website is opened from a secure (https) address, for example after publishing it on GitHub Pages. The walk-in view works anywhere.</p>'}
        </form>`;
      document.body.appendChild(dlg);
      dlg.addEventListener('close', async () => {
        const mode = dlg.returnValue; dlg.remove();
        if (!['xr', 'stereo', 'mono'].includes(mode)) return;
        if (mode === 'stereo') await VRMode.requestMotionPermission();
        try {
          viewer.orbit.autoRotate = false;
          vrSession = await VRMode.start(viewer, sc, {
            mode, accent: c.accent,
            onStop: (i) => { current = i; renderPoiText(); remember({ lastPoi: i }); },
            onExit: (i) => { vrSession = null; current = i; viewer.orbit.flyTo(sc.pois[i].view, 10); renderPoiText(); }
          });
          if (current >= 0) vrSession.go(current);
        } catch (e) {
          vrSession = null;
          toast(mode === 'xr' ? 'Could not start VR: ' + (e.message || 'the headset refused the session') : 'Could not start this view');
        }
      });
      dlg.showModal();
    }

    const keys = (e) => {
      if (viewer.immersive) return;
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight') go(current + 1);
      if (e.key === 'ArrowLeft') go(current - 1);
    };
    document.addEventListener('keydown', keys);
    cleanup = () => { if (vrSession) vrSession.finish(); viewer.dispose(); document.removeEventListener('fullscreenchange', onFs); document.removeEventListener('keydown', keys); };
  }

  /* ================================================================ */
  /* 4. INFORMATION PAGE                                              */
  /* ================================================================ */
  function viewInfo(id, section) {
    const c = DATA[id];
    if (!c) { location.hash = '#/civilizations'; return false; }
    section = SECTIONS.includes(section) ? section : 'overview';
    const s = c.sections[section], idx = SECTIONS.indexOf(section);
    setTitle(`${c.name} — ${s.title}`);
    markVisited(id);
    const prev = SECTIONS[idx - 1], next = SECTIONS[idx + 1];
    const isList = section === 'achievements';
    app.innerHTML = `
      <div class="container" style="--accent:${c.accent}">
        <div class="page-head" style="padding-bottom:24px">
          <a class="back" href="#/civ/${id}">← Back to 3D reconstruction</a>
          <span class="eyebrow">${esc(c.name)} · ${esc(c.era)}</span>
          <h1 style="margin:0">${esc(s.title)}</h1>
        </div>
        <div class="info-layout">
          <nav class="info-nav" aria-label="${esc(c.name)} sections">
            <div class="civ-name">${esc(c.name)}</div>
            ${SECTIONS.map(k => `<a href="#/civ/${id}/info/${k}" class="${k === section ? 'active' : ''}" ${k === section ? 'aria-current="page"' : ''}>${c.sections[k].title}</a>`).join('')}
            <div class="other">${ORDER.filter(o => o !== id).map(o => `<a href="#/civ/${o}/info/${section}">${esc(DATA[o].name)} →</a>`).join('')}</div>
          </nav>
          <div class="info-main">
            <article>
              <figure class="figure">${ART[id]('inf')}<figcaption>Illustration: ${esc(c.name)}</figcaption></figure>
              ${isList ? `<p>${esc(c.name)} left a lasting legacy. Here are some of its most important achievements:</p><ul class="ach">${s.body.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
        : s.body.map(p => `<p>${esc(p)}</p>`).join('')}
              ${section === 'history' || section === 'overview' ? `<h3 style="clear:both;padding-top:12px">Timeline</h3><ol class="timeline">${c.timeline.map(([t, e]) => `<li><time>${esc(t)}</time><span>${esc(e)}</span></li>`).join('')}</ol>` : ''}
              <div class="key-facts"><h3>Key facts</h3><ul>${c.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
            </article>
            <div class="pager">
              ${prev ? `<a class="btn btn-outline" href="#/civ/${id}/info/${prev}">← ${c.sections[prev].title}</a>` : `<a class="btn btn-outline" href="#/civ/${id}">${icon.cube} 3D reconstruction</a>`}
              ${next ? `<a class="btn btn-primary" href="#/civ/${id}/info/${next}">${c.sections[next].title} →</a>` : `<a class="btn btn-primary" href="#/civ/${id}">${icon.cube} Back to 3D view</a>`}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ================================================================ */
  /* 5. AI ARTIFACT RECONSTRUCTION                                    */
  /* ================================================================ */
  const RS = { image: null, imageName: '', refs: [], symmetry: true, sensitivity: 50, result: null, axis: null };
  let SAMPLES = null;
  const STEPS = ['Preparing image', 'Detecting the artifact', 'Analysing symmetry', 'Learning from reference images', 'Rebuilding the shape', 'Restoring missing surface', 'Applying reference colours & blending', 'Predicting the civilization'];

  function readFile(file) {
    return new Promise((res, rej) => {
      if (!file || !file.type.startsWith('image/')) return rej(new Error('Please choose an image file (JPG, PNG or WebP).'));
      if (file.size > 15 * 1024 * 1024) return rej(new Error('That image is larger than 15 MB. Please choose a smaller photo.'));
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('The file could not be read.'));
      r.readAsDataURL(file);
    });
  }

  function viewReconstruct() {
    setTitle('AI Artifact Reconstruction');
    SAMPLES = SAMPLES || Reconstructor.samples();
    app.innerHTML = `
      <div class="container">
        <div class="page-head" style="padding-bottom:10px">
          <span class="eyebrow">New feature</span>
          <h1>AI Artifact Reconstruction</h1>
          <p class="lead">Upload a photo of a broken artifact. The AI studies its shape and symmetry, learns from reference images, and estimates how the complete piece may have looked.</p>
        </div>
        <ol class="stepper" id="stepper">
          <li class="active"><span class="num">1</span>Upload broken artifact</li>
          <li><span class="num">2</span>AI processing</li>
          <li><span class="num">3</span>Reconstructed result</li>
        </ol>
        <div class="recon-layout">
          <div>
            <section class="panel">
              <h3>Upload broken artifact</h3>
              <p class="sub">Drag and drop, paste, or choose a photo. For best results, photograph the object front-on against a plain background.</p>
              <div class="dropzone" id="dropzone">
                <div id="dz-content"></div>
              </div>
              <p class="sub" style="margin:18px 0 0">Or try a sample broken artifact:</p>
              <div class="samples">${SAMPLES.map((s, i) => `<button class="sample" data-sample="${i}"><img src="${s.broken}" alt="">${esc(s.label)}</button>`).join('')}</div>
            </section>
            <section class="panel">
              <h3>Reference images <span class="muted" style="font-family:var(--body);font-size:.85rem;font-weight:500">(optional)</span></h3>
              <p class="sub">Add photos of similar complete artifacts. The AI learns their colours to restore the missing parts more accurately.</p>
              <div class="refs" id="refs"></div>
            </section>
          </div>
          <aside>
            <section class="panel" id="settings-panel">
              <h3>Settings</h3>
              <div class="field">
                <label class="switch"><input type="checkbox" id="opt-sym" ${RS.symmetry ? 'checked' : ''}><span><strong>Symmetrical object</strong><br><span class="hint">Pots, vases, jars, columns and masks are usually symmetrical. Turn off for irregular objects.</span></span></label>
              </div>
              <div class="field">
                <label for="opt-sens">Detection sensitivity: <span id="sens-val">${RS.sensitivity}</span></label>
                <input type="range" id="opt-sens" min="0" max="100" value="${RS.sensitivity}">
                <span class="hint">Increase if parts of the artifact are missed; decrease if the background is included.</span>
              </div>
              <button class="btn btn-gold" id="run" style="width:100%" ${RS.image ? '' : 'disabled'}>${icon.sparkle} Reconstruct artifact</button>
              <div id="process" hidden>
                <div class="progress"><div id="bar"></div></div>
                <ul class="process-list" id="plist">${STEPS.map(s => `<li><span class="dot"></span>${s}</li>`).join('')}</ul>
              </div>
              <div id="err"></div>
            </section>
            <section class="panel">
              <h3>Tips for a good photo</h3>
              <ul class="tips">
                <li>Use a plain, light background that contrasts with the object.</li>
                <li>Photograph straight on, with the object upright and centred.</li>
                <li>Avoid strong shadows and reflections.</li>
                <li>Include all remaining fragments in one photo.</li>
              </ul>
              <p class="muted" style="font-size:.82rem;margin:12px 0 0">Your photos are processed on this device and are not uploaded anywhere.</p>
            </section>
          </aside>
        </div>
      </div>`;

    const dz = $('#dropzone');
    function renderDrop() {
      dz.classList.toggle('has-image', !!RS.image);
      $('#dz-content').innerHTML = RS.image
        ? `<img class="preview" src="${RS.image}" alt="Uploaded artifact preview"><div class="dz-actions"><label class="btn btn-outline btn-sm">${icon.upload} Replace<input type="file" accept="image/*" id="file2" hidden></label><button class="btn btn-outline btn-sm" id="clear">Remove</button></div>`
        : `<div class="dz-icon">${icon.upload}</div><strong>Upload image</strong><p class="muted" style="margin:4px 0 0">Drag &amp; drop or click to browse · JPG, PNG, WebP</p><input type="file" accept="image/*" id="file" aria-label="Upload a photo of a broken artifact">`;
      $('#run').disabled = !RS.image;
      const f = $('#file') || $('#file2');
      f.addEventListener('change', () => f.files[0] && setImage(f.files[0]));
      const clr = $('#clear');
      if (clr) clr.addEventListener('click', (e) => { e.stopPropagation(); RS.image = null; renderDrop(); });
    }
    async function setImage(file) {
      try { RS.image = await readFile(file); RS.imageName = file.name; RS.axis = null; renderDrop(); clearErr(); }
      catch (e) { showErr(e.message); }
    }
    function renderRefs() {
      $('#refs').innerHTML = RS.refs.map((r, i) => `<div class="ref"><img src="${r}" alt="Reference image ${i + 1}"><button data-rm="${i}" aria-label="Remove reference ${i + 1}">×</button></div>`).join('')
        + (RS.refs.length < 6 ? `<label class="ref-add"><div><span>+</span>Add more</div><input type="file" accept="image/*" multiple id="ref-in" aria-label="Add reference images"></label>` : '');
      $$('[data-rm]').forEach(b => b.addEventListener('click', () => { RS.refs.splice(+b.dataset.rm, 1); renderRefs(); }));
      const ri = $('#ref-in');
      if (ri) ri.addEventListener('change', async () => {
        for (const f of [...ri.files].slice(0, 6 - RS.refs.length)) { try { RS.refs.push(await readFile(f)); } catch (e) { showErr(e.message); } }
        renderRefs();
      });
    }
    function showErr(m) { $('#err').innerHTML = `<div class="error-box" role="alert">${esc(m)}</div>`; }
    function clearErr() { $('#err').innerHTML = ''; }

    renderDrop(); renderRefs();
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
    dz.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) setImage(f); });
    const onPaste = (e) => { const f = [...(e.clipboardData || {}).files || []][0]; if (f) setImage(f); };
    document.addEventListener('paste', onPaste);
    cleanup = () => document.removeEventListener('paste', onPaste);

    $$('[data-sample]').forEach(b => b.addEventListener('click', () => {
      const s = SAMPLES[+b.dataset.sample];
      RS.image = s.broken; RS.imageName = s.label; RS.refs = s.refs.slice(); RS.axis = null; RS.symmetry = true;
      $('#opt-sym').checked = true;
      renderDrop(); renderRefs(); clearErr();
      toast(`Loaded sample: ${s.label} (with a reference image)`);
    }));
    $('#opt-sym').addEventListener('change', e => { RS.symmetry = e.target.checked; });
    $('#opt-sens').addEventListener('input', e => { RS.sensitivity = +e.target.value; $('#sens-val').textContent = RS.sensitivity; });

    $('#run').addEventListener('click', async () => {
      clearErr();
      const btn = $('#run');
      btn.disabled = true; btn.innerHTML = 'Processing…';
      $('#process').hidden = false;
      const steps = $$('#plist li');
      steps.forEach(li => li.className = '');
      $$('#stepper li')[0].className = 'done'; $$('#stepper li')[1].className = 'active';
      try {
        RS.axis = null;
        RS.result = await Reconstructor.run(RS.image, RS.refs, { symmetry: RS.symmetry, sensitivity: RS.sensitivity }, (i) => {
          steps.forEach((li, k) => { li.className = k < i ? 'ok' : k === i ? 'run' : ''; if (k < i) li.querySelector('.dot').textContent = '✓'; });
          $('#bar').style.width = Math.round(i / STEPS.length * 100) + '%';
        });
        $('#bar').style.width = '100%';
        location.hash = '#/reconstruct/result';
      } catch (e) {
        showErr(e.message || 'Something went wrong while reconstructing this image.');
        btn.disabled = false; btn.innerHTML = `${icon.sparkle} Reconstruct artifact`;
        $$('#stepper li')[0].className = 'active'; $$('#stepper li')[1].className = '';
      }
    });
  }

  /* ================================================================ */
  /* 6. RECONSTRUCTION RESULT                                         */
  /* ================================================================ */
  function viewResult() {
    if (!RS.result) { location.hash = '#/reconstruct'; return false; }
    setTitle('Reconstruction Result');
    const st = RS.result.stats;
    const level = st.confidence >= 0.72 ? 'high' : st.confidence >= 0.5 ? 'medium' : 'low';
    const confCol = { high: '#2f6b55', medium: '#c48a1e', low: '#b03a2e' }[level];
    app.innerHTML = `
      <div class="container">
        <div class="page-head" style="padding-bottom:10px">
          <a class="back" href="#/reconstruct">← Back to upload</a>
          <span class="eyebrow">AI Artifact Reconstruction</span>
          <h1>Reconstruction Result</h1>
        </div>
        <ol class="stepper">
          <li class="done"><span class="num">✓</span>Upload broken artifact</li>
          <li class="done"><span class="num">✓</span>AI processing</li>
          <li class="active"><span class="num">3</span>Reconstructed result</li>
        </ol>
        ${predictionCard(st.prediction)}
        <div class="recon-layout">
          <div>
            <div class="tabs" role="tablist">
              <button role="tab" data-tab="side" aria-selected="true">Side by side</button>
              <button role="tab" data-tab="compare" aria-selected="false">Compare slider</button>
              <button role="tab" data-tab="restored" aria-selected="false">Restored areas</button>
            </div>
            <div id="tab-body"></div>
            <div class="about-note">
              <strong>About this reconstruction.</strong> The AI used the uploaded artifact${st.references ? ` and ${st.references} reference image${st.references > 1 ? 's' : ''}` : ''} to estimate the complete appearance of the piece. ${st.useSymmetry ? 'Missing areas were rebuilt by mirroring the matching side of the object and filling the remaining gaps from surrounding colours.' : 'Missing areas were filled from the surrounding colours.'} The predicted civilization compares the artifact's colours and shape with typical pottery of each civilization. Results are estimates for educational purposes and should be checked by an expert before being used in research.
            </div>
            <div class="result-actions">
              <a class="btn btn-outline" href="#/reconstruct">Try another artifact</a>
              <button class="btn btn-outline" id="save">${icon.save} Save to gallery</button>
              <button class="btn btn-primary" id="dl">${icon.download} Download result</button>
            </div>
          </div>
          <aside>
            <section class="panel">
              <h3>Analysis</h3>
              <div class="confidence"><span class="pill ${level}">${level[0].toUpperCase() + level.slice(1)} confidence</span><div class="bar"><div style="width:${Math.round(st.confidence * 100)}%;background:${confCol}"></div></div><strong>${Math.round(st.confidence * 100)}%</strong></div>
              <div class="stat-grid">
                <div class="stat"><strong>${st.restoredPct.toFixed(1)}%</strong><span>of the object restored</span></div>
                <div class="stat"><strong>${st.useSymmetry ? Math.round(st.symmetry * 100) + '%' : '—'}</strong><span>symmetry match</span></div>
                <div class="stat"><strong>${st.references}</strong><span>reference image${st.references === 1 ? '' : 's'}</span></div>
                <div class="stat"><strong>${(st.ms / 1000).toFixed(1)}s</strong><span>processing time</span></div>
              </div>
              <div class="legend">
                <span><i style="background:#e8a734"></i>Rebuilt by mirroring the matching side (${st.mirroredPct.toFixed(1)}%)</span>
                <span><i style="background:#d65c42"></i>Inferred from surrounding colours (${st.paintedPct.toFixed(1)}%)</span>
              </div>
              <div class="field" style="margin-bottom:0">
                <label>Colour palette</label>
                <div class="swatches">${st.palette.map(p => `<span title="rgb(${p.rgb.join(',')})" style="background:rgb(${p.rgb.join(',')})"></span>`).join('')}</div>
                <span class="hint">Learned from ${esc(st.paletteSource)}.</span>
              </div>
            </section>
            ${st.useSymmetry ? `
            <section class="panel">
              <h3>Fine-tune</h3>
              <div class="field">
                <label for="axis">Symmetry axis position</label>
                <input type="range" id="axis" min="${st.axisRange[0]}" max="${st.axisRange[1]}" step="0.5" value="${st.axis}">
                <span class="hint">If the result looks lopsided, move the axis to the true centre of the object, then click Update.</span>
              </div>
              <button class="btn btn-outline btn-sm" id="rerun">Update reconstruction</button>
            </section>` : ''}
          </aside>
        </div>
        <section class="section" style="padding-top:36px">
          <div class="section-title"><div><span class="eyebrow">Your gallery</span><h2>Saved reconstructions</h2></div></div>
          <div id="gallery"></div>
        </section>
      </div>`;

    const R = RS.result;
    const clone = (cv) => { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); return c; };
    function showTab(t) {
      $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
      const body = $('#tab-body');
      if (t === 'side') {
        body.innerHTML = `<div class="result-grid">
          <div class="result-card"><h3>Your uploaded artifact</h3><div class="img-box" id="b1"></div></div>
          <div class="result-arrow">${icon.bigArrow}</div>
          <div class="result-card"><h3>AI reconstructed artifact</h3>${st.prediction ? `<p class="muted" style="margin:-6px 0 10px;font-size:.85rem">Predicted: <strong style="color:var(--ink)">${esc(DATA[st.prediction.civ].name)}</strong></p>` : ''}<div class="img-box" id="b2"></div></div></div>`;
        $('#b1').appendChild(clone(R.before)); $('#b2').appendChild(clone(R.result));
      } else if (t === 'compare') {
        body.innerHTML = `<div class="result-card"><div class="img-box"><div class="compare" id="cmp"><span class="lbl" style="left:10px">Before</span></div></div><p class="muted" style="margin:10px 0 0;font-size:.88rem">Drag the handle to compare before and after.</p></div>`;
        const cmp = $('#cmp');
        const a = clone(R.before); cmp.prepend(a);
        const after = document.createElement('div'); after.className = 'after'; after.appendChild(clone(R.result));
        const lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.style.right = '10px'; lbl.textContent = 'After';
        const h = document.createElement('div'); h.className = 'handle'; h.tabIndex = 0; h.setAttribute('role', 'slider'); h.setAttribute('aria-label', 'Comparison position');
        cmp.append(after, lbl, h);
        let pos = 0.5;
        const set = (p) => { pos = Math.max(0, Math.min(1, p)); after.style.clipPath = `inset(0 0 0 ${pos * 100}%)`; h.style.left = `calc(${pos * 100}% - 1.5px)`; h.setAttribute('aria-valuenow', Math.round(pos * 100)); };
        set(0.5);
        const move = (e) => { const r = cmp.getBoundingClientRect(); set((e.clientX - r.left) / r.width); };
        cmp.addEventListener('pointerdown', (e) => { cmp.setPointerCapture(e.pointerId); move(e); cmp.onpointermove = move; });
        cmp.addEventListener('pointerup', () => { cmp.onpointermove = null; });
        h.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') set(pos - 0.05); if (e.key === 'ArrowRight') set(pos + 0.05); });
      } else {
        body.innerHTML = `<div class="result-card"><h3>Restored areas highlighted</h3><div class="img-box" id="b3"></div></div>`;
        $('#b3').appendChild(clone(R.overlay));
      }
    }
    $$('[data-tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
    showTab('side');

    $('#dl').addEventListener('click', () => {
      const name = (RS.imageName || 'artifact').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').toLowerCase();
      download(R.result.toDataURL('image/png'), `${name}-reconstructed.png`);
      toast('Reconstruction downloaded');
    });
    $('#save').addEventListener('click', () => {
      const g = store.get('gallery', []);
      const thumb = document.createElement('canvas'), s = Math.min(1, 300 / Math.max(R.result.width, R.result.height));
      thumb.width = Math.round(R.result.width * s); thumb.height = Math.round(R.result.height * s);
      thumb.getContext('2d').drawImage(R.result, 0, 0, thumb.width, thumb.height);
      g.unshift({ img: thumb.toDataURL('image/jpeg', 0.85), name: RS.imageName || 'Artifact', when: Date.now(), conf: Math.round(st.confidence * 100), civ: st.prediction ? st.prediction.civ : null });
      while (g.length > 8) g.pop();
      if (store.set('gallery', g)) { toast('Saved to your gallery'); renderGallery(); }
      else toast('Could not save — browser storage is full or disabled');
    });
    const rr = $('#rerun');
    if (rr) rr.addEventListener('click', async () => {
      rr.disabled = true; rr.textContent = 'Updating…';
      try {
        RS.result = await Reconstructor.run(RS.image, RS.refs, { symmetry: true, sensitivity: RS.sensitivity, axis: +$('#axis').value }, () => { });
        viewResult(); toast('Reconstruction updated');
      } catch (e) { toast(e.message); rr.disabled = false; rr.textContent = 'Update reconstruction'; }
    });
    function renderGallery() {
      const g = store.get('gallery', []);
      $('#gallery').innerHTML = g.length ? `<div class="gallery">${g.map((it, i) => `<figure><img src="${it.img}" alt="Saved reconstruction of ${esc(it.name)}"><figcaption><span>${esc(it.name)}<br><small class="muted">${it.civ && DATA[it.civ] ? esc(DATA[it.civ].name) + ' · ' : ''}${new Date(it.when).toLocaleDateString()}</small></span><button data-del="${i}">Remove</button></figcaption></figure>`).join('')}</div>`
        : '<p class="muted">No saved reconstructions yet. Click “Save to gallery” to keep this result.</p>';
      $$('[data-del]').forEach(b => b.addEventListener('click', () => { const g2 = store.get('gallery', []); g2.splice(+b.dataset.del, 1); store.set('gallery', g2); renderGallery(); }));
    }
    renderGallery();
  }

  function predictionCard(p) {
    if (!p) return '';
    const c = DATA[p.civ], pct = Math.round(p.probs[p.civ] * 100);
    return `
        <section class="prediction" style="--accent:${c.accent}">
          <div class="pred-art">${ART[p.civ]('pr')}</div>
          <div class="pred-body">
            <span class="eyebrow">Predicted civilization</span>
            <h2>${esc(c.name)} <span class="pred-pct">${pct}% match</span></h2>
            <p class="muted" style="margin:0 0 14px">${esc(c.era)} · ${esc(c.region)}${p.certain ? '' : ' — the features are mixed, so treat this as a weak guess.'}</p>
            <div class="pred-bars">${p.ranked.map(k => `
              <div class="pred-row${k === p.civ ? ' top' : ''}"><span>${esc(DATA[k].name)}</span><div class="bar"><div style="width:${Math.max(2, Math.round(p.probs[k] * 100))}%;background:${DATA[k].accent}"></div></div><strong>${Math.round(p.probs[k] * 100)}%</strong></div>`).join('')}
            </div>
          </div>
          <div class="pred-why">
            <h3>Why the AI thinks so</h3>
            <ul class="checklist">${p.reasons.map(r => `<li>${esc(r)}</li>`).join('') || '<li>Overall colour and shape most similar to this civilization.</li>'}</ul>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
              <a class="btn btn-primary btn-sm" href="#/civ/${p.civ}">${icon.cube} Explore ${esc(c.name)}</a>
              <a class="btn btn-outline btn-sm" href="#/civ/${p.civ}/info/achievements">Learn more</a>
            </div>
          </div>
        </section>`;
  }

  /* ================================================================ */
  /* 7. ABOUT                                                         */
  /* ================================================================ */
  function viewAbout() {
    setTitle('About the Project');
    const team = ['Mahrah Ahmed Hassan Saeed Alyammahi', 'Afraa Mohammed Alawi Hadi Al Hamed', 'Hajar Hashim Mohamed Sharif Alsaqqaf', 'Salama Ali Saeed Kardous Alhadhrami'];
    const cols = ['#b8862b', '#a4502f', '#2f6b55', '#23466b'];
    app.innerHTML = `
      <div class="container">
        <div class="page-head">
          <span class="eyebrow">Capstone project</span>
          <h1>About the Project</h1>
          <p class="lead">Ancient Civilization Reconstructor combines history, technology and artificial intelligence to create an engaging educational experience that helps users understand ancient civilizations through interactive visual reconstructions.</p>
        </div>
        <div class="about-grid" style="padding-bottom:64px">
          <div>
            <section class="panel">
              <h3>Project objectives</h3>
              <ul class="checklist">
                <li>Create an interactive website about ancient civilizations.</li>
                <li>Allow users to select different civilizations.</li>
                <li>Display reconstructed historical environments.</li>
                <li>Provide educational information about each civilization.</li>
                <li>Use technology and AI to improve learning experiences.</li>
              </ul>
            </section>
            <section class="panel">
              <h3>How the system works</h3>
              <ol class="flow">
                <li>Access web platform</li><li>Select civilization</li><li>Retrieve historical data</li><li>Process with reconstruction algorithms</li><li>Generate 3D city layout</li><li>Display interactive environment</li><li>Explore in VR</li><li>Show historical facts</li><li>Save / exit session</li>
              </ol>
              <h3 style="margin-top:24px">AI artifact reconstruction</h3>
              <ol class="flow">
                <li>Upload photo</li><li>Detect artifact</li><li>Find symmetry axis</li><li>Learn reference colours</li><li>Rebuild outline</li><li>Restore surface</li><li>Display &amp; download</li>
              </ol>
              <p class="muted" style="margin:16px 0 0;font-size:.92rem">Reconstruction runs entirely in the browser using image-analysis algorithms (segmentation, symmetry detection, morphological shape completion, inpainting and k-means colour clustering), so no photos leave the user's device.</p>
            </section>
            <section class="panel">
              <h3>Technologies</h3>
              <div class="tech"><span>HTML5</span><span>CSS3</span><span>JavaScript</span><span>WebGL 3D rendering</span><span>Canvas image processing</span><span>WebXR virtual reality</span><span>Visual Studio Code</span><span>Figma</span><span>Blender</span></div>
            </section>
          </div>
          <div>
            <figure class="about-logo"><img src="assets/acr-logo-cream.jpg" alt="ACR — Ancient Civilization Reconstructor logo"></figure>
            <section class="panel">
              <h3>Project details</h3>
              <table class="info-table">
                <tr><th>Cluster</th><td>Computing and Artificial Intelligence</td></tr>
                <tr><th>Campus</th><td>Baniyas — Girls</td></tr>
                <tr><th>Supervisor</th><td>Ms. Ashjan Saleh</td></tr>
                <tr><th>Civilizations</th><td>Ancient Egypt, Ancient Rome, the Maya</td></tr>
              </table>
            </section>
            <section class="panel">
              <h3>Project team</h3>
              <ul class="team">${team.map((n, i) => `<li><span class="avatar" style="background:${cols[i]}">${n.split(' ').filter((_, k, a) => k === 0 || k === a.length - 1).map(w => w[0]).join('')}</span><span>${esc(n)}</span></li>`).join('')}</ul>
            </section>
            <section class="panel">
              <h3>Sources</h3>
              <p class="muted" style="margin:0;font-size:.92rem">Historical content is based on reliable educational sources, research articles and history books. 3D scenes are simplified reconstructions based on the documented layout and proportions of real monuments.</p>
            </section>
          </div>
        </div>
      </div>`;
  }

  /* ---------- Search ---------- */
  const index = [];
  ORDER.forEach(id => {
    const c = DATA[id];
    index.push({ title: c.name, sub: c.era, href: `#/civ/${id}`, text: (c.name + ' ' + c.tagline + ' ' + c.region).toLowerCase() });
    SECTIONS.forEach(s => index.push({ title: `${c.name} — ${c.sections[s].title}`, sub: c.sections[s].body[0].slice(0, 80) + '…', href: `#/civ/${id}/info/${s}`, text: (c.sections[s].body.join(' ') + ' ' + c.sections[s].title).toLowerCase() }));
    SCENES[id].pois.forEach(p => index.push({ title: p.name, sub: `3D landmark · ${c.name}`, href: `#/civ/${id}`, text: (p.name + ' ' + p.text).toLowerCase() }));
  });
  index.push({ title: 'AI Artifact Reconstruction', sub: 'Reconstruct a broken artifact', href: '#/reconstruct', text: 'ai artifact reconstruction broken vase pottery upload' });
  const sIn = $('#site-search'), sOut = $('#search-results');
  let sel = -1;
  function doSearch() {
    const q = sIn.value.trim().toLowerCase();
    if (q.length < 2) { sOut.hidden = true; return; }
    const words = q.split(/\s+/);
    const hits = index.map(it => ({ it, score: words.reduce((a, w) => a + (it.title.toLowerCase().includes(w) ? 3 : 0) + (it.text.includes(w) ? 1 : 0), 0), all: words.every(w => it.text.includes(w) || it.title.toLowerCase().includes(w)) }))
      .filter(h => h.all).sort((a, b) => b.score - a.score).slice(0, 8);
    sel = -1;
    sOut.innerHTML = hits.length ? hits.map(h => `<a href="${h.it.href}" role="option">${esc(h.it.title)}<small>${esc(h.it.sub)}</small></a>`).join('') : '<div class="empty">No results found.</div>';
    sOut.hidden = false;
  }
  sIn.addEventListener('input', doSearch);
  sIn.addEventListener('keydown', (e) => {
    const items = $$('a', sOut);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((a, i) => a.classList.toggle('focus', i === sel)); }
    if (e.key === 'Enter' && items.length) { location.hash = items[Math.max(0, sel)].getAttribute('href'); sOut.hidden = true; sIn.value = ''; sIn.blur(); }
    if (e.key === 'Escape') { sOut.hidden = true; sIn.blur(); }
  });
  sOut.addEventListener('click', () => { sOut.hidden = true; sIn.value = ''; });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) sOut.hidden = true; });

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav-toggle'), nav = $('#primary-nav');
  function closeMenu() { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', () => { const o = !nav.classList.contains('open'); nav.classList.toggle('open', o); toggle.setAttribute('aria-expanded', o); });

  function download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

  route();
})();
