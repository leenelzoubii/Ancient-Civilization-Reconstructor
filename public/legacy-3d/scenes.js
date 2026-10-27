/* =====================================================================
   3D reconstruction scenes for each civilization.
   Every scene is generated procedurally from simple shapes, based on
   the documented layout and proportions of real monuments.
   Units are roughly "1 unit ≈ 2 metres".
   ===================================================================== */
(function (global) {
  'use strict';
  const PI = Math.PI;
  const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

  /* ------------------------------------------------------------------ */
  /* ANCIENT EGYPT — Giza plateau, the Sphinx, a temple and the Nile     */
  /* ------------------------------------------------------------------ */
  const egypt = {
    id: 'egypt', vrScale: 5, title: 'Ancient Egypt — Giza & the Nile',
    sky: 'linear-gradient(180deg,#9cc3dd 0%,#d9e4e0 45%,#f2dcb1 100%)',
    light: { sun: [0.55, 0.75, 0.35], sunColor: '#fff1d6', sky: '#cfe0f0', ground: '#c9a46a' },
    fog: { color: '#efdcb7', density: 0.0042 },
    camera: { target: [15, 6, -10], theta: -0.7, phi: 1.12, radius: 170, minRadius: 18, maxRadius: 330 },
    build(mb, U) {
      const R = U.rng(7);
      const riverX = -48;
      const sand = '#dcbb80', sandDark = '#c9a266', field = '#7d9a45', field2 = '#93a94f';
      const H = (x, z) => {
        const dunes = 1.6 * Math.sin(x * 0.045) * Math.cos(z * 0.06) + 1.1 * Math.sin((x + z) * 0.09) + 0.6 * Math.cos(x * 0.13 - z * 0.05);
        const plateau = smooth(80, 140, Math.hypot(x - 30, z + 30));
        const nearRiver = smooth(14, 30, Math.abs(x - riverX));
        const h = (dunes + 2) * plateau * nearRiver;
        return Math.abs(x - riverX) < 9 ? -0.6 : h;
      };
      this.heightAt = H;
      mb.terrain({
        size: 420, seg: 110, height: H,
        color: (x, z, y) => {
          const dx = Math.abs(x - riverX);
          if (dx < 9) return '#5f8a6a';
          if (dx < 28) return (Math.floor(z / 9) % 2 === 0) ? field : field2;
          return U.mix(sandDark, sand, Math.min(1, (y + 1) / 5));
        }
      });
      // The Nile
      mb.box({ x: riverX, y: -0.5, z: 0, w: 17, h: 0.55, d: 420, color: '#3f7fa6', top: '#4a8db5' });

      // Pyramid helper: square pyramid with original white limestone casing and gilded capstone
      const pyramid = (x, z, base, h, color, cap) => {
        const r = base / Math.SQRT2;
        mb.frustum({ x, y: 0, z, rb: r, rt: 0, h, sides: 4, a0: PI / 4, color, caps: false });
        if (cap) mb.frustum({ x, y: h * 0.9, z, rb: r * 0.105, rt: 0, h: h * 0.105, sides: 4, a0: PI / 4, color: '#d9a92e', caps: false });
      };
      // Khufu (Great Pyramid), Khafre, Menkaure — Giza alignment
      pyramid(20, -20, 46, 29.3, '#eee2c4', true);
      pyramid(56, -62, 43, 27.2, '#e7d8b6', true);
      mb.frustum({ x: 56, y: 22.6, z: -62, rb: 43 / Math.SQRT2 * 0.17, rt: 0, h: 4.6, sides: 4, a0: PI / 4, color: '#efe6cf', caps: false });
      pyramid(84, -92, 21, 13.6, '#c99a76', false);
      // Queens' pyramids
      [-32, -22, -12].forEach(z => pyramid(50, z, 8, 5.4, '#e3d3b0', false));
      // Mortuary temple, causeway and valley temple
      mb.box({ x: -6, y: 0, z: -20, w: 9, h: 3, d: 14, color: '#e1d2b2' });
      mb.box({ x: -22, y: 0, z: -20, w: 22, h: 0.8, d: 2.6, color: '#d7c6a3' });
      mb.box({ x: -36, y: 0, z: -20, w: 8, h: 4, d: 9, color: '#bfa78a', top: '#cdb595' });

      // Great Sphinx (faces east toward the river)
      const sx = -6, sz = 14;
      mb.box({ x: sx - 4, y: -0.6, z: sz, w: 26, h: 0.6, d: 12, color: '#c9a56d' });
      mb.box({ x: sx, y: 0, z: sz, w: 11, h: 3.2, d: 3.6, color: '#d8b77e' });
      mb.box({ x: sx - 6.4, y: 0, z: sz - 1.2, w: 4.5, h: 0.9, d: 1, color: '#d8b77e' });
      mb.box({ x: sx - 6.4, y: 0, z: sz + 1.2, w: 4.5, h: 0.9, d: 1, color: '#d8b77e' });
      mb.box({ x: sx - 4.2, y: 2.4, z: sz, w: 3, h: 2.6, d: 3.8, color: '#3e5f8a' });
      mb.box({ x: sx - 4.6, y: 3.2, z: sz, w: 2.4, h: 2.8, d: 2.2, color: '#d8b77e' });
      mb.box({ x: sx - 4.3, y: 5.9, z: sz, w: 2.6, h: 0.5, d: 2.6, color: '#3e5f8a' });

      // Temple complex: pylon gateway, obelisks, hypostyle hall, avenue of sphinxes
      const tx = -12, tz = 66;
      [-6.5, 6.5].forEach(o => mb.frustum({ x: tx + o, y: 0, z: tz, rb: 6.4, rt: 5.2, h: 13, sides: 4, a0: PI / 4, sz: 0.42, color: '#e3cfa6', capColor: '#d4bd92' }));
      mb.box({ x: tx, y: 0, z: tz, w: 4, h: 8, d: 3.2, color: '#d6c09a' });
      mb.box({ x: tx, y: 0, z: tz - 1.5, w: 2.4, h: 6, d: 0.5, color: '#5a4630' });
      [-3.5, 3.5].forEach(o => {
        mb.frustum({ x: tx + o, y: 0, z: tz - 7, rb: 0.95, rt: 0.6, h: 14, sides: 4, a0: PI / 4, color: '#c2683c', caps: false });
        mb.frustum({ x: tx + o, y: 14, z: tz - 7, rb: 0.6, rt: 0, h: 1.2, sides: 4, a0: PI / 4, color: '#d9a92e', caps: false });
      });
      mb.box({ x: tx, y: 0, z: tz + 11, w: 22, h: 1, d: 18, color: '#d8c6a4' });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        mb.frustum({ x: tx - 7.5 + j * 5, y: 1, z: tz + 4.5 + i * 4.3, rb: 0.95, rt: 0.85, h: 8, sides: 10, color: '#e0cda6' });
        mb.frustum({ x: tx - 7.5 + j * 5, y: 9, z: tz + 4.5 + i * 4.3, rb: 0.9, rt: 1.35, h: 1.2, sides: 10, color: '#6c9a6a' });
      }
      mb.box({ x: tx, y: 10.2, z: tz + 11, w: 22, h: 1, d: 18, color: '#e3d2b0' });
      for (let k = 0; k < 7; k++) {
        [-4, 4].forEach(o => {
          mb.box({ x: tx + o, y: 0, z: tz - 12 - k * 4, w: 1.2, h: 0.6, d: 2.4, color: '#cdb38a' });
          mb.box({ x: tx + o, y: 0.6, z: tz - 12 - k * 4 + 0.8, w: 0.9, h: 1, d: 0.8, color: '#cdb38a' });
        });
      }
      mb.box({ x: tx, y: 0, z: tz - 26, w: 5, h: 0.15, d: 34, color: '#e8d9b8' });

      // Workers' village (mud-brick houses)
      for (let i = 0; i < 26; i++) {
        const x = -26 + (i % 6) * 5.2 + R() * 1.4, z = -58 - Math.floor(i / 6) * 5.4 + R() * 1.4;
        const h = 2 + R() * 1.6;
        mb.box({ x, y: H(x, z) - 0.3, z, w: 3.6 + R(), h, d: 3.6 + R(), color: U.shade('#b48a5c', 0.9 + R() * 0.2), top: '#a77d52' });
      }

      // Date palms along the riverbanks
      const palm = (x, z) => {
        const y = H(x, z) - 0.2, h = 6 + R() * 3;
        mb.frustum({ x, y, z, rb: 0.32, rt: 0.2, h, sides: 6, color: '#7a5a3a', caps: false });
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * PI * 2 + R();
          mb.box({ x: x + Math.cos(a) * 1.4, y: y + h - 0.6, z: z + Math.sin(a) * 1.4, w: 3.2, h: 0.18, d: 0.9, ry: -a, color: U.shade('#4f7a32', 0.85 + R() * 0.3) });
        }
        mb.sphere({ x, y: y + h - 0.5, z, r: 0.8, color: '#55803a', lat: 3, lon: 5 });
      };
      for (let i = 0; i < 70; i++) {
        const side = i % 2 ? 1 : -1;
        palm(riverX + side * (11 + R() * 12), -190 + (i / 70) * 380 + R() * 3);
      }

      // Feluccas (sailing boats) on the Nile
      [[-60, 1], [10, -1], [95, 1], [-130, -1]].forEach(([z, d]) => {
        mb.box({ x: riverX + d * 2, y: -0.2, z, w: 1.6, h: 0.7, d: 5.5, color: '#7a5434' });
        mb.box({ x: riverX + d * 2, y: 0.5, z, w: 0.15, h: 6, d: 0.15, color: '#5a3d22' });
        mb.gable({ x: riverX + d * 2, y: 0.9, z: z - 0.2, w: 4, h: 5.2, len: 0.08, ry: PI / 2, color: '#f2ead8' });
      });
    },
    pois: [
      { id: 'khufu', vr: { stand: [32, 35] }, name: 'Great Pyramid of Khufu', pos: [20, 31, -20], view: { target: [20, 12, -20], theta: -0.5, phi: 1.2, radius: 85 },
        text: 'Built for King Khufu around 2560 BCE. Here it is shown as it originally looked: covered in smooth, polished white limestone with a capstone that may have been gilded.' },
      { id: 'khafre', name: 'Pyramid of Khafre', pos: [56, 29, -62], view: { target: [56, 12, -62], theta: 0.4, phi: 1.2, radius: 80 },
        text: 'Khufu\'s son Khafre built the second pyramid. It still keeps part of its original casing stones near the top, which is why that section is highlighted.' },
      { id: 'sphinx', name: 'The Great Sphinx', pos: [-10, 8, 14], view: { target: [-8, 3, 14], theta: -1.35, phi: 1.25, radius: 30 },
        text: 'A lion\'s body with a king\'s head, carved from the bedrock of the plateau and facing the rising sun. Traces of paint show it was once brightly coloured.' },
      { id: 'temple', vr: { stand: [-12, 32] }, name: 'Temple & Obelisks', pos: [-12, 16, 60], view: { target: [-12, 6, 62], theta: -0.35, phi: 1.2, radius: 55 },
        text: 'Egyptian temples were entered through a massive pylon gateway, flanked by obelisks and reached by an avenue of sphinxes. Inside, a forest of columns formed the hypostyle hall.' },
      { id: 'nile', name: 'The Nile & Farmland', pos: [-48, 4, -40], view: { target: [-48, 0, -50], theta: -1.6, phi: 1.05, radius: 70 },
        text: 'The yearly flood of the Nile left rich black soil on the banks. Farmers grew wheat, barley and flax, and boats carried goods and building stone along the river.' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* ANCIENT ROME — Colosseum, temple, triumphal arch, aqueduct, insulae */
  /* ------------------------------------------------------------------ */
  const rome = {
    id: 'rome', vrScale: 2.1, title: 'Ancient Rome — The Imperial City',
    sky: 'linear-gradient(180deg,#7fb0d8 0%,#cfe0ec 55%,#efe6d6 100%)',
    light: { sun: [0.45, 0.8, 0.4], sunColor: '#fff4e2', sky: '#d6e6f4', ground: '#9a9a78' },
    fog: { color: '#e4e6e0', density: 0.0031 },
    camera: { target: [0, 6, 0], theta: 0.65, phi: 1.1, radius: 150, minRadius: 14, maxRadius: 320 },
    build(mb, U) {
      const R = U.rng(21);
      const H = (x, z) => {
        const d = Math.hypot(x, z);
        return smooth(120, 200, d) * (6 + 5 * Math.sin(x * 0.03) * Math.cos(z * 0.025));
      };
      this.heightAt = H;
      mb.terrain({
        size: 440, seg: 90, height: H,
        color: (x, z, y) => (Math.abs(x) < 95 && Math.abs(z) < 75) ? U.mix('#b9ad94', '#c7bba3', (Math.sin(x * 0.7) * Math.cos(z * 0.7) + 1) / 2) : U.mix('#7f9450', '#9aa860', Math.min(1, y / 8))
      });

      // --- Colosseum ---
      const a = 26, b = 21.6, N = 40, tierH = 6, trav = '#dcd0b6';
      const ellipse = (t, k = 0) => [(a + k) * Math.cos(t), (b + k) * Math.sin(t)];
      const normalAng = (t) => { const nx = Math.cos(t) / a, nz = Math.sin(t) / b; return Math.atan2(nx, nz); };
      for (let tier = 0; tier < 3; tier++) {
        const y0 = tier * tierH;
        for (let i = 0; i < N; i++) {
          const t = (i / N) * PI * 2, [x, z] = ellipse(t);
          mb.box({ x, y: y0, z, w: 1.35, h: tierH, d: 2.2, ry: normalAng(t), color: U.shade(trav, 0.97 + (tier % 2) * 0.04) });
          const tm = ((i + 0.5) / N) * PI * 2, [mx, mz] = ellipse(tm);
          mb.arch({ x: mx, y: y0 + tierH - 0.75 - 1.75, z: mz, r: 1.2, thick: 0.55, depth: 2.1, ry: normalAng(tm), seg: 7, color: trav });
        }
        mb.frustum({ y: y0 + tierH - 0.75, rb: 1, h: 0.75, sides: 72, sx: a + 1.15, sz: b + 1.15, caps: false, color: '#e6dcc4' });
      }
      mb.frustum({ y: 18, rb: 1, h: 5, sides: 72, sx: a + 1.0, sz: b + 1.0, caps: false, color: '#d6caaf' });
      for (let i = 0; i < N; i += 2) {
        const t = (i / N) * PI * 2, [x, z] = ellipse(t, 1.1);
        mb.box({ x, y: 18, z, w: 0.9, h: 5, d: 0.5, ry: normalAng(t), color: '#e6dcc4' });
      }
      mb.frustum({ y: 0, rb: 1, h: 23, sides: 72, sx: a - 1.6, sz: b - 1.6, caps: false, color: '#a89c84' });
      // Seating (cavea) in stacked tiers
      for (let k = 0; k < 9; k++) {
        const r0 = 0.47 + k * 0.053, r1 = r0 + 0.053;
        mb.frustum({ y: 1.6 + k * 2.1, rb: r0, rt: r1, h: 2.1, sides: 72, sx: a - 1.6, sz: b - 1.6, caps: false, color: k % 3 === 2 ? '#bfb196' : '#e3d8bf' });
      }
      mb.frustum({ y: 0, rb: 0.47, h: 1.6, sides: 72, sx: a - 1.6, sz: b - 1.6, caps: false, color: '#c4b69a' });
      mb.disk({ y: 0.7, rx: (a - 1.6) * 0.47, rz: (b - 1.6) * 0.47, seg: 72, color: '#d8bf8a' });

      // --- Temple & forum ---
      const tx = 62, tz = -26;
      mb.box({ x: tx, y: 0, z: tz + 6, w: 46, h: 0.3, d: 54, color: '#ddd4c2' });
      mb.box({ x: tx, y: 0, z: tz, w: 16, h: 3.2, d: 26, color: '#d8cfbb' });
      for (let s = 0; s < 6; s++) mb.box({ x: tx, y: 0, z: tz + 13 + s * 0.6, w: 10, h: 3.2 - s * 0.53, d: 0.62, color: '#e2d9c5' });
      mb.box({ x: tx, y: 3.2, z: tz - 4, w: 12.4, h: 8.6, d: 17, color: '#efe6d3' });
      const cols = [];
      for (let i = 0; i < 6; i++) { cols.push([tx - 6.25 + i * 2.5, tz + 11.3]); cols.push([tx - 6.25 + i * 2.5, tz + 8.6]); }
      for (let k = 0; k < 6; k++) { cols.push([tx - 6.25, tz + 5.6 - k * 3.1]); cols.push([tx + 6.25, tz + 5.6 - k * 3.1]); }
      cols.forEach(([x, z]) => {
        mb.frustum({ x, y: 3.2, z, rb: 0.58, rt: 0.5, h: 8, sides: 12, stripe: 0.93, color: '#f3ecdc' });
        mb.box({ x, y: 11.2, z, w: 1.5, h: 0.6, d: 1.5, color: '#e8dfc9' });
      });
      mb.box({ x: tx, y: 11.8, z: tz, w: 15, h: 1.4, d: 25.4, color: '#ece3cf' });
      mb.gable({ x: tx, y: 13.2, z: tz, w: 15.6, h: 3.6, len: 25.8, color: '#b0573a', face: '#ece3cf' });
      for (let i = 0; i < 8; i++) {
        mb.box({ x: tx - 20 + (i % 2) * 40, y: 0, z: tz - 14 + Math.floor(i / 2) * 9, w: 1.6, h: 2.2, d: 1.6, color: '#d6cdb9' });
        mb.box({ x: tx - 20 + (i % 2) * 40, y: 2.2, z: tz - 14 + Math.floor(i / 2) * 9, w: 0.9, h: 2.6, d: 0.9, color: '#9c8f6a' });
      }
      [-1, 1].forEach(s => {
        for (let k = 0; k < 10; k++) mb.frustum({ x: tx + s * 22, y: 0, z: tz - 18 + k * 5, rb: 0.45, rt: 0.4, h: 7, sides: 8, color: '#ebe2cf' });
        mb.box({ x: tx + s * 22, y: 7, z: tz + 4.5, w: 1.6, h: 0.8, d: 47, color: '#e6ddca' });
      });

      // --- Triumphal arch ---
      const ax = 0, az = 48;
      [-1, 1].forEach(s => mb.box({ x: ax + s * 3.6, y: 0, z: az, w: 3.6, h: 9.2, d: 4.2, color: '#e9e0cc' }));
      mb.arch({ x: ax, y: 6.4, z: az, r: 1.8, thick: 0.9, depth: 4.2, color: '#e9e0cc' });
      mb.box({ x: ax, y: 9.2, z: az, w: 10.8, h: 4.2, d: 4.4, color: '#e2d8c2' });
      mb.box({ x: ax, y: 10.3, z: az + 2.25, w: 6, h: 2, d: 0.15, color: '#cbbd9c' });
      mb.box({ x: ax, y: 13.4, z: az, w: 3, h: 1.8, d: 2, color: '#7e6b45' });

      // --- Aqueduct (two tiers of arches) ---
      const az2 = -78, startX = -150, endX = -20, span = 6.4;
      for (let x = startX; x <= endX; x += span) {
        const g = H(x, az2);
        mb.box({ x, y: g - 1, z: az2, w: 1.9, h: 11 - g + 1, d: 2.6, color: '#c8a77c' });
        mb.box({ x, y: 10, z: az2, w: 1.5, h: 6.5, d: 2.1, color: '#c9a97f' });
        if (x + span <= endX) {
          mb.arch({ x: x + span / 2, y: 7.8, z: az2, r: (span - 1.9) / 2, thick: 0.7, depth: 2.6, color: '#c3a074' });
          mb.arch({ x: x + span / 2, y: 13.9, z: az2, r: (span - 1.5) / 2, thick: 0.6, depth: 2.1, color: '#c3a074' });
        }
      }
      mb.box({ x: (startX + endX) / 2, y: 16.5, z: az2, w: endX - startX + 2, h: 1.5, d: 2.4, color: '#b99a72' });
      mb.box({ x: endX + 3, y: 0, z: az2, w: 6, h: 18, d: 6, color: '#bfa27c' });

      // --- Residential insulae (apartment blocks) ---
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const x = -72 + i * 14, z = 14 + j * 14, h = 8 + R() * 8;
        const body = ['#d9a066', '#cf8f5a', '#e1b47d', '#c88552'][(i + j) % 4];
        mb.box({ x, y: 0, z, w: 11, h, d: 11, color: body });
        for (let f = 1; f < h / 3.2; f++) mb.box({ x, y: f * 3.2, z: z + 5.55, w: 9, h: 0.25, d: 0.25, color: '#8a5e3c' });
        mb.gable({ x, y: h, z, w: 11.6, h: 2.2, len: 11.6, ry: (i + j) % 2 ? PI / 2 : 0, color: '#a5492e' });
      }
      // Roads paved with basalt
      mb.box({ x: 0, y: 0, z: 34, w: 200, h: 0.12, d: 5, color: '#6e6a63' });
      mb.box({ x: 34, y: 0, z: -10, w: 5, h: 0.12, d: 120, color: '#6e6a63' });
      // Cypresses & umbrella pines
      for (let i = 0; i < 90; i++) {
        const ang = R() * PI * 2, d = 100 + R() * 90, x = Math.cos(ang) * d, z = Math.sin(ang) * d, g = H(x, z);
        if (R() < 0.6) mb.frustum({ x, y: g, z, rb: 1.3, rt: 0, h: 9 + R() * 5, sides: 7, color: U.shade('#3b5a2f', 0.85 + R() * 0.3), caps: false });
        else {
          mb.frustum({ x, y: g, z, rb: 0.35, rt: 0.28, h: 7, sides: 6, color: '#6b4f35', caps: false });
          mb.sphere({ x, y: g + 6, z, r: 4, sy: 0.4, color: U.shade('#4d6b34', 0.9 + R() * 0.2), vary: true });
        }
      }
    },
    pois: [
      { id: 'colosseum', name: 'The Colosseum', pos: [0, 26, 0], view: { target: [0, 8, 0], theta: 0.9, phi: 1.22, radius: 78 },
        text: 'The Flavian Amphitheatre was opened in 80 CE and could seat around 50,000 spectators. Its outer wall of travertine stone has three levels of arches topped by a solid attic storey.' },
      { id: 'arena', vr: { stand: [0, 6], y: 0.7 }, name: 'Inside the Arena', pos: [0, 4, 0], view: { target: [0, 2, 0], theta: 0.2, phi: 0.62, radius: 46 },
        text: 'Seating was divided by social rank: senators sat closest to the arena, ordinary citizens higher up. Beneath the wooden arena floor were tunnels and lifts called the hypogeum.' },
      { id: 'temple', name: 'Temple & Forum', pos: [62, 20, -26], view: { target: [62, 7, -24], theta: 0.15, phi: 1.22, radius: 55 },
        text: 'Roman temples stood on a high podium and were entered from the front by a wide staircase. The forum around it was the centre of public, political and religious life.' },
      { id: 'arch', name: 'Triumphal Arch', pos: [0, 16, 48], view: { target: [0, 7, 48], theta: 0.05, phi: 1.3, radius: 36 },
        text: 'Triumphal arches celebrated military victories. The inscription panel on the top recorded the emperor\'s achievements for every passer-by to read.' },
      { id: 'aqueduct', name: 'Aqueduct', pos: [-85, 20, -78], view: { target: [-85, 9, -78], theta: 0.55, phi: 1.25, radius: 70 },
        text: 'Aqueducts carried fresh water into the city using only gravity, falling very gently over many kilometres. Eleven aqueducts eventually supplied Rome\'s fountains, baths and homes.' },
      { id: 'insulae', name: 'Insulae (apartments)', pos: [-51, 20, 35], view: { target: [-51, 6, 35], theta: -0.6, phi: 1.15, radius: 60 },
        text: 'Most Romans lived in insulae: apartment blocks several storeys high with shops on the ground floor. Wealthier families lived in single-storey houses called domus.' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* THE MAYA — Chichén Itzá: El Castillo, ball court, cenote            */
  /* ------------------------------------------------------------------ */
  const maya = {
    id: 'maya', vrScale: 1.25, title: 'The Maya — Chichén Itzá',
    sky: 'linear-gradient(180deg,#8cc4d4 0%,#d3e9e3 50%,#e8efd8 100%)',
    light: { sun: [0.4, 0.82, 0.42], sunColor: '#fff6e0', sky: '#d4ece8', ground: '#5d7a42' },
    fog: { color: '#d8e6d8', density: 0.0033 },
    camera: { target: [0, 8, -10], theta: 0.55, phi: 1.12, radius: 150, minRadius: 16, maxRadius: 320 },
    build(mb, U) {
      const R = U.rng(99);
      const cen = [0, -96];
      const H = (x, z) => {
        const dc = Math.hypot(x - cen[0], z - cen[1]);
        if (dc < 12.5) return -7;
        const jungle = smooth(80, 120, Math.max(Math.abs(x) * 0.95, Math.abs(z + 20) * 0.85));
        return jungle * (1.5 + 1.2 * Math.sin(x * 0.07) * Math.cos(z * 0.05)) + 0.15 * Math.sin(x * 0.3 + z * 0.2);
      };
      this.heightAt = H;
      mb.terrain({
        size: 440, seg: 110, height: H,
        color: (x, z, y) => {
          const plaza = Math.abs(x) < 80 && z > -82 && z < 48;
          if (y < -3) return '#7d705c';
          return plaza ? U.mix('#c4b993', '#b0a780', (Math.sin(x * 0.4) + Math.cos(z * 0.35) + 2) / 4) : U.mix('#3f6630', '#5b8040', Math.min(1, Math.max(0, y / 3)));
        }
      });

      // --- El Castillo (Temple of Kukulcán) ---
      const tiers = 9, base = 34, top = 12.5, th = 2.15, lime = '#d9cfb3';
      for (let i = 0; i < tiers; i++) {
        const s = base - i * (base - top) / (tiers - 1);
        mb.frustum({ y: i * th, rb: s / 2 * Math.SQRT2, rt: (s - 0.7) / 2 * Math.SQRT2, h: th, sides: 4, a0: PI / 4, color: U.shade(lime, i % 2 ? 0.95 : 1.02) });
      }
      const topY = tiers * th, steps = 26, sh = topY / steps;
      for (let side = 0; side < 4; side++) {
        const ry = side * PI / 2;
        for (let i = 0; i < steps; i++) {
          const out = 21.5 - (i + 1) * (21.5 - 6.4) / steps;
          mb.box({ x: 0, y: 0, z: (out + 3) / 2, w: 7.6, h: (i + 1) * sh, d: out - 3, ry, color: i % 2 ? '#e4dbc2' : '#d8cfb4' });
        }
        [-4.1, 4.1].forEach(o => {
          for (let i = 0; i < steps; i += 2) {
            const out = 21.9 - (i + 1) * (21.9 - 6.4) / steps;
            mb.box({ x: o, y: 0, z: (out + 3) / 2, w: 0.7, h: (i + 1.4) * sh, d: out - 3, ry, color: '#cbc1a4' });
          }
        });
        // Feathered-serpent heads at the base of the stairs
        [-4.1, 4.1].forEach(o => {
          const p = Engine3D.MeshBuilder.xf([o, 0, 22.6], { ry });
          mb.box({ x: p[0], y: 0, z: p[2], w: 1.6, h: 1.4, d: 2, ry, color: '#7f9c6a' });
        });
      }
      // Upper temple with red-painted frieze and four doorways
      mb.box({ y: topY, w: 10.5, h: 5.2, d: 10.5, color: '#e8e0c8' });
      mb.box({ y: topY + 3.6, w: 11, h: 1, d: 11, color: '#a3412e' });
      mb.box({ y: topY + 5.2, w: 9, h: 0.9, d: 9, color: '#d6ccb0' });
      for (let side = 0; side < 4; side++) {
        const ry = side * PI / 2;
        [-2.2, 0, 2.2].forEach(o => { const p = Engine3D.MeshBuilder.xf([o, 0, 5.3], { ry }); mb.box({ x: p[0], y: topY, z: p[2], w: 1.2, h: 3, d: 0.15, ry, color: '#3b3226' }); });
      }

      // --- Great Ball Court ---
      const bx = -58, bz = 0;
      [-1, 1].forEach(s => {
        mb.box({ x: bx + s * 9.5, y: 0, z: bz, w: 6, h: 8, d: 52, color: '#d2c8aa' });
        mb.box({ x: bx + s * 6, y: 0, z: bz, w: 2.2, h: 1.4, d: 52, color: '#c8bd9e' });
        mb.arch({ x: bx + s * 6.35, y: 6.2, z: bz, r: 0.8, thick: 0.35, depth: 0.5, ry: PI / 2, start: 0, end: PI * 2, seg: 14, color: '#bfb393' });
      });
      [-1, 1].forEach(s => {
        mb.box({ x: bx, y: 0, z: bz + s * 30, w: 12, h: 3, d: 6, color: '#d2c8aa' });
        mb.box({ x: bx, y: 3, z: bz + s * 30, w: 7, h: 3.6, d: 4.5, color: '#e3dac2', top: '#a3412e' });
      });
      mb.box({ x: bx + 9.5, y: 8, z: bz - 6, w: 5, h: 4, d: 7, color: '#e3dac2', top: '#a3412e' });

      // --- Temple of the Warriors with its colonnade ---
      const wx = 58, wz = -8;
      for (let i = 0; i < 4; i++) {
        const s = 28 - i * 2.4;
        mb.frustum({ x: wx, y: i * 2.6, z: wz, rb: s / 2 * Math.SQRT2, rt: (s - 0.8) / 2 * Math.SQRT2, h: 2.6, sides: 4, a0: PI / 4, color: U.shade(lime, i % 2 ? 0.95 : 1.02) });
      }
      for (let i = 0; i < 16; i++) {
        const out = 18.5 - (i + 1) * (18.5 - 10.4) / 16;
        mb.box({ x: wx - (out + 8) / 2, y: 0, z: wz, w: out - 8, h: (i + 1) * 0.65, d: 8, color: i % 2 ? '#e4dbc2' : '#d8cfb4' });
      }
      mb.box({ x: wx, y: 10.4, z: wz, w: 14, h: 5, d: 14, color: '#e8e0c8' });
      mb.box({ x: wx, y: 13.8, z: wz, w: 14.6, h: 1, d: 14.6, color: '#a3412e' });
      for (let i = 0; i < 5; i++) for (let j = 0; j < 8; j++) mb.frustum({ x: wx - 22 - i * 3.6, y: 0, z: wz - 14 + j * 4, rb: 0.6, h: 4.5, sides: 8, color: '#e6decb' });

      // --- Platform of Venus ---
      mb.box({ x: 0, y: 0, z: -44, w: 13, h: 3.2, d: 13, color: '#d6ccb0' });
      for (let side = 0; side < 4; side++) {
        const ry = side * PI / 2;
        for (let i = 0; i < 5; i++) { const p = Engine3D.MeshBuilder.xf([0, 0, 6.5 + (5 - i) * 0.55], { ry }); mb.box({ x: p[0], y: 0, z: p[2] - 44, w: 4, h: (i + 1) * 0.64, d: 0.55, ry, color: '#e2d9c0' }); }
      }

      // --- Sacbé (white causeway) to the Sacred Cenote ---
      mb.box({ x: 0, y: 0, z: -66, w: 6.5, h: 0.35, d: 38, color: '#ede7d4' });
      mb.frustum({ x: cen[0], y: -7, z: cen[1], rb: 12.5, h: 7.2, sides: 36, caps: false, color: '#857862' });
      mb.disk({ x: cen[0], y: -4.6, z: cen[1], rx: 12.4, rz: 12.4, seg: 36, color: '#2f6e69' });
      mb.box({ x: cen[0], y: 0, z: cen[1] + 13.5, w: 5, h: 2.2, d: 4, color: '#d6ccb0' });

      // --- Stelae (carved stone monuments) ---
      [[-24, 22], [24, 22], [-30, -28], [30, -28], [-12, 34], [12, 34]].forEach(([x, z]) => {
        mb.box({ x, y: 0, z, w: 1.6, h: 3.8, d: 0.7, color: '#9e9583' });
        mb.box({ x, y: 0, z: z + 1.4, w: 1.4, h: 0.7, d: 1.4, color: '#b4ab97' });
      });

      // --- Jungle ---
      for (let i = 0; i < 340; i++) {
        const x = (R() - 0.5) * 420, z = (R() - 0.5) * 420;
        if ((Math.abs(x) < 86 && z > -88 && z < 54) || Math.hypot(x - cen[0], z - cen[1]) < 20) continue;
        const g = H(x, z), h = 4 + R() * 6;
        mb.frustum({ x, y: g, z, rb: 0.45, rt: 0.3, h, sides: 5, color: '#5a4430', caps: false });
        const c = U.shade(['#2f5a2a', '#3f6e34', '#4b7a35', '#355f2b'][i % 4], 0.85 + R() * 0.3);
        mb.sphere({ x, y: g + h - 2, z, r: 3 + R() * 2.8, sy: 0.75, color: c, vary: true, lat: 4, lon: 7 });
        if (R() < 0.4) mb.sphere({ x: x + 2, y: g + h - 3, z: z + 1.5, r: 2.4, sy: 0.8, color: U.shade(c, 1.1), lat: 4, lon: 6 });
      }
    },
    pois: [
      { id: 'castillo', name: 'El Castillo (Kukulcán)', pos: [0, 28, 0], view: { target: [0, 10, 0], theta: 0.35, phi: 1.2, radius: 80 },
        text: 'Nine stepped terraces with a staircase on each side. Each staircase has 91 steps; together with the top platform that makes 365 — the days of the solar year.' },
      { id: 'ballcourt', vr: { stand: [-58, 20] }, name: 'Great Ball Court', pos: [-58, 12, 0], view: { target: [-58, 3, 0], theta: -0.4, phi: 1.05, radius: 62 },
        text: 'Players struck a heavy rubber ball with their hips and tried to pass it through stone rings set high on the walls. The game had deep religious and political meaning.' },
      { id: 'warriors', vr: { stand: [34, -32] }, name: 'Temple of the Warriors', pos: [58, 19, -8], view: { target: [50, 7, -8], theta: -1.1, phi: 1.2, radius: 65 },
        text: 'A stepped temple fronted by rows of stone columns that once supported a roof. The columns are carved with images of warriors.' },
      { id: 'cenote', name: 'Sacred Cenote', pos: [0, 3, -96], view: { target: [0, -2, -92], theta: 0.05, phi: 0.95, radius: 48 },
        text: 'A natural sinkhole filled with groundwater, linked to the main plaza by a raised white road (sacbé). Offerings such as jade, gold and pottery were thrown into the water.' },
      { id: 'venus', name: 'Platform of Venus', pos: [0, 6, -44], view: { target: [0, 2, -44], theta: 0.6, phi: 1.1, radius: 34 },
        text: 'A low ceremonial platform decorated with symbols of the planet Venus, which Maya astronomers tracked with remarkable accuracy.' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* TAJ MAHAL — charbagh garden, mausoleum, minarets, gateway           */
  /* ------------------------------------------------------------------ */
  const tajMahal = {
    id: 'taj-mahal', vrScale: 2.5, title: 'The Taj Mahal — Agra, India',
    sky: 'linear-gradient(180deg,#e8b98f 0%,#f4ddc6 42%,#fbf3e6 100%)',
    light: { sun: [0.42, 0.68, 0.5], sunColor: '#ffe9c8', sky: '#f6e3cd', ground: '#c9ad82' },
    fog: { color: '#f3e2cc', density: 0.0034 },
    camera: { target: [0, 10, -34], theta: 0.42, phi: 1.13, radius: 150, minRadius: 20, maxRadius: 310 },
    build(mb, U) {
      const R = U.rng(41);
      const marble = '#f5f0e3', marble2 = '#e8e1cf', marble3 = '#dcd4bf';
      const red = '#b25a3c', red2 = '#c26c4c', green = '#6f8f45', green2 = '#88a253';
      const inGarden = (x, z) => Math.abs(x) < 64 && z > -54 && z < 62;
      const H = (x, z) => {
        if (inGarden(x, z)) return 0;
        const d = Math.hypot(x * 0.8, z - 6);
        return smooth(66, 150, d) * (2.4 + 1.2 * Math.sin(x * 0.05) * Math.cos(z * 0.04));
      };
      this.heightAt = H;
      mb.terrain({
        size: 420, seg: 100, height: H,
        color: (x, z, y) => {
          if (inGarden(x, z)) return U.mix(green, green2, (Math.sin(x * 0.22) * Math.cos(z * 0.19) + 1) / 2);
          if (z < -92) return '#8fa06f';
          return U.mix('#cbb083', '#e0c99c', Math.min(1, (y + 1) / 4));
        }
      });

      // Yamuna river behind the tomb
      mb.box({ x: 0, y: -0.7, z: -114, w: 420, h: 0.8, d: 34, color: '#5f92a6', top: '#74a7b8' });
      mb.box({ x: 0, y: -0.2, z: -134, w: 420, h: 0.4, d: 10, color: '#a8b07a' });

      // Charbagh: cross walkways and the long reflecting pool
      mb.box({ x: 0, y: 0.02, z: 4, w: 9, h: 0.1, d: 112, color: '#efe9d8' });
      mb.box({ x: 0, y: 0.02, z: -30, w: 118, h: 0.1, d: 8, color: '#efe9d8' });
      mb.box({ x: 0, y: 0.12, z: -2, w: 8.4, h: 0.2, d: 96, color: '#7fb2c4', top: '#9ccbda' });
      [-4.6, 4.6].forEach((o) => mb.box({ x: o, y: 0.1, z: -2, w: 0.8, h: 0.34, d: 98, color: marble2 }));
      [-50, 46].forEach((z) => mb.box({ x: 0, y: 0.1, z, w: 9.2, h: 0.34, d: 0.9, color: marble2 }));
      [-30, -12, 6, 24, 40].forEach((z) =>
        mb.frustum({ x: 0, y: 0.3, z, rb: 0.14, rt: 0.05, h: 1.6, sides: 6, color: '#dff0f4' })
      );

      // Perimeter wall with corner towers and the great gateway
      mb.box({ x: -64, y: 0, z: 4, w: 2, h: 3.2, d: 120, color: red });
      mb.box({ x: 64, y: 0, z: 4, w: 2, h: 3.2, d: 120, color: red });
      mb.box({ x: -48.5, y: 0, z: -56, w: 31, h: 3.2, d: 2, color: red });
      mb.box({ x: 48.5, y: 0, z: -56, w: 31, h: 3.2, d: 2, color: red });
      mb.box({ x: -38.5, y: 0, z: 64, w: 51, h: 3.2, d: 2, color: red });
      mb.box({ x: 38.5, y: 0, z: 64, w: 51, h: 3.2, d: 2, color: red });
      [[-64, -56], [64, -56], [-64, 64], [64, 64]].forEach(([x, z]) => {
        mb.frustum({ x, y: 0, z, rb: 3.2, rt: 2.9, h: 5, sides: 8, color: red2 });
        mb.sphere({ x, y: 5, z, r: 2.9, sy: 0.55, color: '#efe6d2' });
      });

      // Mausoleum terrace, plinth and the tomb block
      mb.box({ x: 0, y: 0, z: -70, w: 46, h: 0.5, d: 46, color: '#e6dcc6' });
      mb.box({ x: 0, y: 0.5, z: -70, w: 40, h: 1.3, d: 40, color: marble2, top: '#f7f2e6' });
      const plinth = 1.8;
      mb.box({ x: 0, y: plinth, z: -70, w: 23, h: 12, d: 23, color: marble, top: '#f8f3e8' });

      // Carved faces: central iwan plus two pairs of smaller arches
      const faceArch = (fx, fz, ry, big) => {
        const r = big ? 3.3 : 1.45, w = big ? 6.6 : 2.9, sh = big ? 6.2 : 4.2;
        mb.box({ x: fx, y: plinth, z: fz, w, h: sh, d: 0.45, ry, color: '#6b5a44' });
        mb.arch({ x: fx, y: plinth + sh, z: fz, r, thick: 0.55, depth: 0.5, ry, color: marble3, seg: 12 });
      };
      faceArch(0, -58.4, 0, true);
      [-6.1, -9.1, 6.1, 9.1].forEach((o) => faceArch(o, -58.4, 0, false));
      faceArch(0, -81.6, 0, true);
      [-6.1, -9.1, 6.1, 9.1].forEach((o) => faceArch(o, -81.6, 0, false));
      faceArch(11.6, -70, PI / 2, true);
      [-6.1, -9.1, 6.1, 9.1].forEach((o) => faceArch(11.6, -70 + o, PI / 2, false));
      faceArch(-11.6, -70, PI / 2, true);
      [-6.1, -9.1, 6.1, 9.1].forEach((o) => faceArch(-11.6, -70 + o, PI / 2, false));

      // Drum, onion dome and gilded finial
      mb.frustum({ x: 0, y: plinth + 12, z: -70, rb: 7.3, rt: 7.1, h: 3.2, sides: 24, color: marble2 });
      mb.sphere({ x: 0, y: plinth + 14.2, z: -70, r: 7.4, sy: 0.9, lat: 8, lon: 16, color: '#f8f3e6' });
      mb.frustum({ x: 0, y: plinth + 27.4, z: -70, rb: 1.15, rt: 0.95, h: 1.1, sides: 12, color: marble2 });
      mb.frustum({ x: 0, y: plinth + 28.5, z: -70, rb: 0.4, rt: 0.05, h: 2.6, sides: 6, color: '#d9b45a', caps: false });
      [0, 0.8, 1.6].forEach((o) =>
        mb.sphere({ x: 0, y: plinth + 29.6 + o, z: -70, r: 0.32, sy: 1, color: '#d9b45a' })
      );

      // Four chhatris on the roof
      [[-8.2, -8.2], [8.2, -8.2], [-8.2, 8.2], [8.2, 8.2]].forEach(([dx, dz]) => {
        const cx = dx, cz = -70 + dz;
        mb.frustum({ x: cx, y: plinth + 12, z: cz, rb: 2.4, rt: 2.4, h: 0.5, sides: 8, color: marble2 });
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * PI * 2 + PI / 4;
          mb.frustum({ x: cx + Math.cos(a) * 1.7, y: plinth + 12.5, z: cz + Math.sin(a) * 1.7, rb: 0.26, rt: 0.22, h: 2.4, sides: 6, color: marble });
        }
        mb.sphere({ x: cx, y: plinth + 14.7, z: cz, r: 1.55, sy: 0.85, color: '#f8f3e6' });
        mb.frustum({ x: cx, y: plinth + 17, z: cz, rb: 0.22, rt: 0.02, h: 1.2, sides: 5, color: '#d9b45a', caps: false });
      });

      // Four minarets
      const minaret = (x, z) => {
        mb.frustum({ x, y: plinth, z, rb: 1.6, rt: 1.25, h: 2.4, sides: 8, color: marble2 });
        mb.frustum({ x, y: plinth + 2.4, z, rb: 1.05, rt: 0.92, h: 12.4, sides: 8, color: marble });
        [4.6, 8.8, 12.6].forEach((by) => {
          mb.frustum({ x, y: plinth + by, z, rb: 1.75, rt: 1.75, h: 0.34, sides: 8, color: marble2 });
          mb.frustum({ x, y: plinth + by + 0.34, z, rb: 1.1, rt: 1.1, h: 0.9, sides: 8, color: marble });
        });
        mb.frustum({ x, y: plinth + 14.8, z, rb: 1.0, rt: 1.7, h: 0.45, sides: 8, color: marble2 });
        mb.sphere({ x, y: plinth + 15.25, z, r: 1.15, sy: 0.95, color: '#f8f3e6' });
        mb.frustum({ x, y: plinth + 17.3, z, rb: 0.16, rt: 0.02, h: 1.1, sides: 5, color: '#d9b45a', caps: false });
      };
      [[-18, -18], [18, -18], [-18, 18], [18, 18]].forEach(([dx, dz]) => minaret(dx, -70 + dz));

      // Mosque (west) and its mirror-image jawab (east), in red sandstone
      [-1, 1].forEach((s) => {
        const x = s * 32;
        mb.box({ x, y: 0, z: -70, w: 18, h: 0.6, d: 27, color: '#e6dcc6' });
        mb.box({ x, y: 0.6, z: -70, w: 15, h: 6, d: 23, color: red, top: '#c8b393' });
        mb.box({ x, y: 0.6, z: -70, w: 15.6, h: 0.6, d: 23.6, color: red2 });
        for (let i = -1; i <= 1; i++) {
          const z = -70 + i * 7.2;
          mb.box({ x: x - s * 7.7, y: 1.2, z, w: 3.2, h: 4.2, d: 0.5, ry: PI / 2, color: '#6b4a3a' });
          mb.arch({ x: x - s * 7.7, y: 5.4, z, r: 1.5, thick: 0.5, depth: 0.5, ry: PI / 2, color: '#e0cbb0' });
          mb.sphere({ x, y: 6.6, z, r: 2.5, sy: 0.95, color: '#f2ead8' });
          mb.frustum({ x, y: 9.2, z, rb: 0.22, rt: 0.02, h: 1.4, sides: 5, color: '#d9b45a', caps: false });
        }
      });

      // Great gateway (Darwaza)
      const gz = 64;
      mb.box({ x: 0, y: 0, z: gz, w: 26, h: 10, d: 7, color: red, top: '#c8b393' });
      mb.box({ x: 0, y: 0, z: gz, w: 27, h: 0.6, d: 8, color: red2 });
      mb.box({ x: 0, y: 0.4, z: gz + 3.5, w: 5.6, h: 6, d: 0.6, color: '#5e4133' });
      mb.arch({ x: 0, y: 6.4, z: gz + 3.5, r: 2.8, thick: 0.8, depth: 0.6, color: '#e6d2b6', seg: 14 });
      [-8.2, 8.2].forEach((o) => {
        mb.box({ x: o, y: 0.4, z: gz + 3.5, w: 2.6, h: 4.4, d: 0.5, color: '#5e4133' });
        mb.arch({ x: o, y: 4.8, z: gz + 3.5, r: 1.3, thick: 0.5, depth: 0.5, color: '#e6d2b6' });
      });
      [-9.5, -5, 0, 5, 9.5].forEach((o) =>
        mb.sphere({ x: o, y: 10, z: gz, r: 1.5, sy: 0.9, color: '#f2ead8' })
      );
      [-12, 12].forEach((o) => {
        mb.frustum({ x: o, y: 10, z: gz, rb: 1.1, rt: 0.95, h: 2.4, sides: 8, color: marble2 });
        mb.sphere({ x: o, y: 12.4, z: gz, r: 1.15, sy: 0.9, color: '#f2ead8' });
      });
      mb.box({ x: 0, y: 0, z: gz + 6, w: 30, h: 0.3, d: 6, color: '#e6dcc6' });

      // Cypresses along the pool and flowering trees in the quadrants
      const cypress = (x, z) => {
        const y = H(x, z);
        mb.frustum({ x, y, z, rb: 0.3, rt: 0.22, h: 1.6, sides: 6, color: '#6b4f35', caps: false });
        mb.frustum({ x, y: y + 1.4, z, rb: 1.1, rt: 0, h: 6 + R() * 2, sides: 7, color: U.shade('#3d6135', 0.85 + R() * 0.3), caps: false });
      };
      for (let z = -48; z <= 54; z += 7) { cypress(-11.2, z); cypress(11.2, z); }
      for (let i = 0; i < 26; i++) {
        const x = (R() < 0.5 ? -1 : 1) * (17 + R() * 40), z = -46 + R() * 102;
        mb.frustum({ x, y: 0, z, rb: 0.35, rt: 0.25, h: 1.8, sides: 5, color: '#6b4f35', caps: false });
        mb.sphere({ x, y: 1.6, z, r: 1.7 + R(), sy: 0.8, color: U.shade(['#c96a5a', '#d98b6a', '#b9554a'][i % 3], 0.9 + R() * 0.2) });
      }
    },
    pois: [
      { id: 'mausoleum', vr: { stand: [0, -48], y: 1.8 }, name: 'The Mausoleum & Dome', pos: [0, 30, -70], view: { target: [0, 14, -70], theta: 0.45, phi: 1.2, radius: 58 },
        text: 'The tomb of Mumtaz Mahal and Shah Jahan. Its bulbous white-marble dome rises 73 metres above the garden, crowned by a gilded finial, and the walls are inlaid with thousands of semi-precious stones.' },
      { id: 'minarets', name: 'The Four Minarets', pos: [18, 20, -52], view: { target: [0, 18, -70], theta: 0.9, phi: 1.15, radius: 55 },
        text: 'Four minarets frame the tomb and lean very slightly outward, so that if they ever collapsed they would fall away from the central dome. Each has three balconies reached by an internal staircase.' },
      { id: 'gateway', name: 'The Great Gateway', pos: [0, 14, 64], view: { target: [0, 6, 64], theta: 0.1, phi: 1.25, radius: 38 },
        text: 'The Darwaza is the formal entrance to the complex. Its central arch frames the Taj Mahal perfectly from the forecourt — a deliberate piece of symmetry that prepares the visitor for the view inside.' },
      { id: 'charbagh', vr: { stand: [0, 34], y: 0.2 }, name: 'Charbagh Garden & Pool', pos: [0, 5, 8], view: { target: [0, 2, -14], theta: 0.35, phi: 1.1, radius: 62 },
        text: 'The garden is a charbagh: a square divided into four quarters by walkways and water channels, a Persian symbol of Paradise. The long reflecting pool doubles the image of the tomb.' },
      { id: 'mosque', name: 'Mosque & Jawab', pos: [32, 13, -70], view: { target: [32, 5, -70], theta: 1.0, phi: 1.2, radius: 44 },
        text: 'Red-sandstone buildings flank the tomb: the mosque on the west and its mirror image, the jawab or "answer", on the east. The pair keeps the composition perfectly balanced around the mausoleum.' },
      { id: 'yamuna', name: 'Yamuna River Terrace', pos: [0, 7, -104], view: { target: [0, 3, -96], theta: -0.4, phi: 1.15, radius: 60 },
        text: 'The Taj stands on a terrace above the Yamuna river. Boats once brought marble, sandstone and inlay stones to the site, and the river cooled the gardens through the hot Agra summers.' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* PETRA — the Siq, Al-Khazneh, theater, tombs, colonnaded street      */
  /* ------------------------------------------------------------------ */
  const petra = {
    id: 'petra', vrScale: 2.2, title: 'Petra — The Rose-Red City',
    sky: 'linear-gradient(180deg,#8fb8d6 0%,#e2d3bd 48%,#f6dfc2 100%)',
    light: { sun: [0.5, 0.72, 0.45], sunColor: '#ffe6c2', sky: '#efdcc4', ground: '#a9664f' },
    fog: { color: '#efd6bb', density: 0.0022 },
    camera: { target: [0, 10, 6], theta: 0.6, phi: 1.12, radius: 160, minRadius: 16, maxRadius: 330 },
    build(mb, U) {
      const R = U.rng(77);
      const rose = '#8d4f3d', rose2 = '#a3634b', rose3 = '#d9a184', rose4 = '#f0cfb2', dark = '#4a2a1d', sand = '#e8d5b2';
      const H = (x, z) => {
        const out = Math.max(Math.abs(x) - 24, 0);
        const wall = smooth(0, 74, out) * (20 + 7 * Math.sin(z * 0.045 + 0.5) + 4 * Math.cos(z * 0.09));
        const end = smooth(0, 70, Math.max(-(z + 84), 0)) * 16;
        return wall + end + 0.35 * Math.sin(x * 0.06) * Math.cos(z * 0.05);
      };
      this.heightAt = H;
      mb.terrain({
        size: 440, seg: 110, height: H,
        color: (x, z, y) => {
          const rock = Math.min(1, y / 11);
          return U.mix(sand, U.mix('#a3634b', '#8d4f3d', (Math.sin(x * 0.07) * Math.cos(z * 0.06) + 1) / 2), rock);
        }
      });

      // --- The Siq: a narrow canyon in the eastern cliff ---
      const siqX = 40;
      [-1, 1].forEach((s) => {
        for (let i = 0; i < 8; i++) {
          const z = 32 + i * 8;
          const h = 14 + 3 * s + R() * 2.5;
          mb.box({ x: siqX + s * 6.6 + (R() - 0.5) * 0.8, y: 0, z, w: 5.4, h, d: 8.1, color: U.shade(rose, 0.92 + R() * 0.16), top: rose2 });
          mb.box({ x: siqX + s * (6.6 - 2.7) + (R() - 0.5) * 0.5, y: 0, z, w: 0.5, h: h - 3, d: 8, color: U.shade(rose2, 0.85 + R() * 0.25) });
        }
      });
      mb.box({ x: siqX, y: 0.02, z: 64, w: 8.4, h: 0.06, d: 72, color: '#dcc39c' });
      [-1, 1].forEach((s) => mb.box({ x: siqX + s * 4.1, y: 0.9, z: 64, w: 0.7, h: 0.5, d: 70, color: '#8d6b4e' }));

      // --- Al-Khazneh: the Treasury ---
      mb.box({ x: 0, y: 0, z: 2, w: 36, h: 28, d: 14, color: rose, top: rose2 });
      [-1, 1].forEach((s) => {
        mb.box({ x: s * 22, y: 0, z: 2, w: 9, h: 21 + R() * 3, d: 14, color: rose, top: rose2 });
        mb.box({ x: s * 31, y: 0, z: 2, w: 10, h: 15 + R() * 4, d: 13, color: U.shade(rose, 0.95), top: rose2 });
      });
      for (let i = 0; i < 8; i++) {
        mb.box({ x: -16 + i * 4.6, y: 28, z: 2 + (R() - 0.5) * 4, w: 4.2, h: 1 + R() * 2.4, d: 11, color: U.shade(rose2, 0.9 + R() * 0.2) });
      }
      const tz = 9.3;
      for (let i = 0; i < 6; i++) {
        const x = -10.25 + i * 4.1;
        mb.frustum({ x, y: 0.4, z: tz, rb: 0.72, rt: 0.58, h: 10.4, sides: 10, color: rose4 });
        mb.box({ x, y: 10.8, z: tz, w: 1.7, h: 0.55, d: 1.7, color: rose4 });
      }
      mb.box({ x: 0, y: 11.35, z: tz - 0.2, w: 26.5, h: 1.5, d: 1.7, color: rose3 });
      mb.gable({ x: 0, y: 12.85, z: tz - 0.2, w: 26.5, h: 3.4, len: 1.7, color: rose3, face: rose4 });
      mb.box({ x: 0, y: 0.4, z: tz + 0.5, w: 3.6, h: 6.4, d: 0.5, color: dark });
      mb.arch({ x: 0, y: 6.8, z: tz + 0.5, r: 1.8, thick: 0.5, depth: 0.5, color: rose3, seg: 12 });
      [-5.2, 5.2].forEach((o) => mb.box({ x: o, y: 3.2, z: tz + 0.5, w: 1.7, h: 4.2, d: 0.4, color: '#70463a' }));
      mb.frustum({ x: 0, y: 15.7, z: tz - 0.6, rb: 3.6, rt: 3.4, h: 6.2, sides: 14, color: rose2 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2;
        mb.frustum({ x: Math.cos(a) * 4.4, y: 15.7, z: tz - 0.6 + Math.sin(a) * 4.4, rb: 0.36, rt: 0.3, h: 5.8, sides: 8, color: rose3 });
      }
      mb.frustum({ x: 0, y: 21.9, z: tz - 0.6, rb: 4.3, rt: 0, h: 2.2, sides: 14, color: rose2, caps: false });
      mb.frustum({ x: 0, y: 24.1, z: tz - 0.6, rb: 0.75, rt: 0, h: 1.5, sides: 8, color: rose3, caps: false });
      mb.sphere({ x: 0, y: 25.6, z: tz - 0.6, r: 0.9, sy: 1, color: rose3 });
      [-7.4, 7.4].forEach((o) => {
        mb.box({ x: o, y: 15.7, z: tz - 0.6, w: 5.4, h: 6, d: 2.6, color: rose2 });
        mb.gable({ x: o, y: 21.7, z: tz - 0.6, w: 5.8, h: 1.8, len: 2.8, color: rose2, face: rose3 });
        mb.box({ x: o, y: 16.2, z: tz + 0.6, w: 2.2, h: 4.4, d: 0.3, color: '#70463a' });
      });
      mb.box({ x: 0, y: 0.03, z: 26, w: 44, h: 0.08, d: 34, color: sand });

      // --- Street of Facades: tombs cut into the eastern cliff ---
      mb.box({ x: 28, y: 0, z: -14, w: 14, h: 18, d: 86, color: rose, top: rose2 });
      for (let i = 0; i < 5; i++) {
        const z = 20 - i * 10.5, y0 = 4.5 + (i % 2) * 1.6;
        mb.box({ x: 21.4, y: y0, z, w: 3.4, h: 5, d: 0.5, ry: PI / 2, color: dark });
        [-1.9, 1.9].forEach((o) => mb.box({ x: 21.1, y: y0, z: z + o, w: 0.6, h: 5.6, d: 0.7, ry: PI / 2, color: rose3 }));
        mb.box({ x: 21.0, y: y0 + 5.6, z, w: 5.6, h: 0.7, d: 0.9, ry: PI / 2, color: rose2 });
        mb.gable({ x: 20.9, y: y0 + 6.3, z, w: 5.6, h: 1.6, len: 0.9, ry: PI / 2, color: rose2, face: rose3 });
      }

      // --- Western cliff and the rock-cut theater ---
      mb.box({ x: -30, y: 0, z: -12, w: 14, h: 15, d: 80, color: rose, top: rose2 });
      const th = { x: -14, z: 24 };
      for (let k = 0; k < 7; k++) {
        const r = 3.6 + k * 1.45, y = 0.25 + k * 1.15, n = 12;
        for (let i = 0; i < n; i++) {
          const a = PI / 2 + (i + 0.5) / n * PI;
          mb.box({ x: th.x + Math.cos(a) * r, y, z: th.z + Math.sin(a) * r, w: r * (PI / n) + 0.4, h: 1.15, d: 1.45, ry: -(a + PI / 2), color: k % 2 ? rose3 : rose2 });
        }
      }
      // orchestra floor and the stage building
      mb.disk({ x: th.x, y: 0.1, z: th.z, rx: 3.4, rz: 3.4, seg: 18, color: '#dcc39c' });
      mb.box({ x: th.x + 2.4, y: 0, z: th.z, w: 4.4, h: 1.1, d: 13.6, color: rose3 });
      mb.box({ x: th.x + 5.6, y: 0, z: th.z, w: 1.6, h: 7.2, d: 15, color: rose2 });
      for (let i = 0; i < 3; i++) mb.box({ x: th.x + 6.4, y: 1.4, z: th.z - 4.6 + i * 4.6, w: 0.5, h: 4.4, d: 2.2, color: dark });

      // --- Colonnaded Street and Qasr al-Bint ---
      mb.box({ x: 0, y: 0.02, z: -28, w: 15, h: 0.1, d: 56, color: '#d7bb92' });
      for (let z = -52; z <= -4; z += 6) {
        [-6.4, 6.4].forEach((x) => {
          const h = 6.4 + (R() < 0.25 ? -1.6 : 0);
          mb.frustum({ x, y: 0, z, rb: 0.55, rt: 0.46, h, sides: 10, color: rose3 });
          mb.box({ x, y: h, z, w: 1.3, h: 0.4, d: 1.3, color: rose2 });
        });
      }
      mb.box({ x: 0, y: 0, z: -64, w: 22, h: 9.5, d: 15, color: rose2, top: rose3 });
      mb.box({ x: 0, y: 0, z: -56.5, w: 20, h: 0.5, d: 3, color: rose3 });
      for (let i = 0; i < 6; i++) mb.frustum({ x: -8 + i * 3.2, y: 0.5, z: -56.5, rb: 0.55, rt: 0.45, h: 7.4, sides: 10, color: rose3 });
      mb.box({ x: 0, y: 7.9, z: -56.5, w: 20, h: 1.1, d: 3.4, color: rose2 });
      mb.gable({ x: 0, y: 9, z: -56.5, w: 20, h: 3.4, len: 3.4, color: rose2, face: rose3 });

      // --- Royal Tombs high on the eastern cliff ---
      mb.box({ x: 20.6, y: 10, z: -44, w: 0.6, h: 9, d: 22, ry: PI / 2, color: rose2 });
      for (let i = 0; i < 4; i++) {
        const z = -52 + i * 5.4;
        mb.frustum({ x: 20.2, y: 11, z, rb: 0.45, rt: 0.38, h: 6.6, sides: 8, color: rose3 });
      }
      mb.box({ x: 19.9, y: 17.6, z: -44, w: 1, h: 1.2, d: 22, ry: PI / 2, color: rose2 });
      mb.gable({ x: 19.7, y: 18.8, z: -44, w: 22, h: 2.6, len: 1, ry: PI / 2, color: rose2, face: rose3 });
      mb.box({ x: 20.3, y: 11, z: -44, w: 3.4, h: 5.4, d: 0.4, ry: PI / 2, color: dark });

      // Fallen column drums and boulders
      for (let i = 0; i < 22; i++) {
        const x = -30 + R() * 60, z = -54 + R() * 110;
        if (Math.abs(x) < 8 && z > -20) continue;
        mb.sphere({ x, y: 0, z, r: 0.6 + R() * 1.2, sy: 0.7, color: U.shade(rose3, 0.9 + R() * 0.2), lat: 3, lon: 5 });
      }
    },
    pois: [
      { id: 'siq', name: 'The Siq', pos: [40, 11, 76], view: { target: [40, 6, 44], theta: 0.06, phi: 1.2, radius: 44 },
        text: 'The Siq is a 1.2 km natural gorge with walls up to 80 metres high. The Nabateans cut channels and clay pipes along both sides to carry rainwater into the city, and the Treasury suddenly appears through a narrow slit in the rock.' },
      { id: 'treasury', name: 'Al-Khazneh (The Treasury)', pos: [0, 27, 10], view: { target: [0, 12, 9], theta: 0.12, phi: 1.2, radius: 40 },
        text: 'Al-Khazneh is 39 metres tall and was carved directly into the sandstone cliff in the 1st century BCE, probably as the tomb of a Nabatean king. Its classical columns, pediments and tholos blend Greek and local styles, and an urn crowns the top.' },
      { id: 'theater', name: 'The Rock-Cut Theater', pos: [-16, 11, 24], view: { target: [-16, 4, 24], theta: 1.5, phi: 1.15, radius: 30 },
        text: 'The theater was cut into the rock in the 1st century CE and could hold around 6,000 spectators. Its semicircular rows follow the natural slope, and the stage wall behind was later damaged by earthquakes.' },
      { id: 'facades', name: 'Street of Facades', pos: [20, 15, 6], view: { target: [21, 9, 0], theta: -1.45, phi: 1.15, radius: 30 },
        text: 'Dozens of tomb facades line the cliffs on both sides of the valley. Their carved doorways, pediments and obelisks copy the shapes of free-standing temples, but they are cut straight into the mountainside.' },
      { id: 'street', vr: { stand: [0, -6] }, name: 'Colonnaded Street', pos: [0, 9, -28], view: { target: [0, 3, -28], theta: 0.2, phi: 1.12, radius: 44 },
        text: 'The colonnaded street was the commercial heart of Roman-era Petra. Caravans bringing frankincense, myrrh and spices from southern Arabia passed between its shops and fountains, and the Qasr al-Bint temple closed the view.' },
      { id: 'tombs', name: 'The Royal Tombs', pos: [20, 26, -44], view: { target: [21, 15, -44], theta: -1.35, phi: 1.2, radius: 34 },
        text: 'The Royal Tombs — the Urn, Silk and Palace tombs — are carved high into the eastern cliff. Their sandstone shifts from pink to purple and orange through the day, which is why Petra is called the Rose-Red City.' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* KHOR FAKKAN — Portuguese fort, harbor, coral town, Hajar mountains   */
  /* ------------------------------------------------------------------ */
  const khorFakkan = {
    id: 'khorfakkan', vrScale: 1.6, title: 'Khor Fakkan — The Portuguese Fort',
    sky: 'linear-gradient(180deg,#79b3d4 0%,#cfe6ea 48%,#f2e3c8 100%)',
    light: { sun: [0.5, 0.75, 0.42], sunColor: '#fff3da', sky: '#d8ebf4', ground: '#b9a179' },
    fog: { color: '#e2e9e2', density: 0.0015 },
    camera: { target: [-4, 9, 0], theta: 0.75, phi: 1.1, radius: 140, minRadius: 14, maxRadius: 300 },
    build(mb, U) {
      const R = U.rng(63);
      const coral = '#d9c9a6', coral2 = '#c9b58e', coral3 = '#e4d6b8', wood = '#6b4a2f';
      const H = (x, z) => {
        if (x > 30) return -2.2;
        const inland = smooth(50, 108, -x);
        const ridge = 18 + 8 * Math.sin(z * 0.03 + 0.6) + 4 * Math.cos(z * 0.075);
        return inland * ridge + 0.3 * Math.sin(x * 0.2 + z * 0.15) + smooth(30, 8, x) * 0.5;
      };
      this.heightAt = H;
      mb.terrain({
        size: 440, seg: 100, height: H,
        color: (x, z, y) => {
          if (x > 30) return '#2f6f8f';
          if (y > 2.5) return U.mix('#6f563e', '#9c7a55', Math.min(1, y / 26));
          return U.mix('#dcc094', '#cdb083', (Math.sin(x * 0.3) * Math.cos(z * 0.25) + 1) / 2);
        }
      });

      // The Gulf of Oman
      mb.box({ x: 132, y: -0.7, z: 0, w: 200, h: 0.62, d: 440, color: '#2c6b8a', top: '#3f86a8' });
      for (let i = 0; i < 26; i++) {
        const x = 32 + R() * 150, z = -200 + R() * 400;
        mb.box({ x, y: -0.02, z, w: 2.5 + R() * 3, h: 0.06, d: 0.35, color: '#cfe8ee' });
      }

      // --- The fort: square walls, four round bastions, gatehouse ---
      const fx = -12, fz = 0, W = 30, D = 26, wh = 7.2;
      mb.box({ x: fx, y: 0, z: fz - D / 2, w: W, h: wh, d: 2.2, color: coral });
      mb.box({ x: fx - 9.75, y: 0, z: fz + D / 2, w: 10.5, h: wh, d: 2.2, color: coral });
      mb.box({ x: fx + 9.75, y: 0, z: fz + D / 2, w: 10.5, h: wh, d: 2.2, color: coral });
      mb.box({ x: fx - W / 2, y: 0, z: fz, w: 2.2, h: wh, d: D, color: coral });
      mb.box({ x: fx + W / 2, y: 0, z: fz, w: 2.2, h: wh, d: D, color: coral });

      const crenel = (x0, z0, x1, z1, y, n) => {
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          mb.box({ x: x0 + (x1 - x0) * t, y, z: z0 + (z1 - z0) * t, w: 1.1, h: 1, d: 1.1, color: coral3 });
        }
      };
      crenel(fx - W / 2, fz - D / 2, fx + W / 2, fz - D / 2, wh, 13);
      crenel(fx - W / 2, fz + D / 2, fx - 4.5, fz + D / 2, wh, 5);
      crenel(fx + 4.5, fz + D / 2, fx + W / 2, fz + D / 2, wh, 5);
      crenel(fx - W / 2, fz - D / 2, fx - W / 2, fz + D / 2, wh, 11);
      crenel(fx + W / 2, fz - D / 2, fx + W / 2, fz + D / 2, wh, 11);

      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        const x = fx + sx * W / 2, z = fz + sz * D / 2;
        mb.frustum({ x, y: 0, z, rb: 4.3, rt: 4.0, h: 9.4, sides: 16, color: coral });
        mb.frustum({ x, y: 9.4, z, rb: 4.6, rt: 4.6, h: 0.7, sides: 16, color: coral3 });
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * PI * 2;
          mb.box({ x: x + Math.cos(a) * 4.0, y: 10.1, z: z + Math.sin(a) * 4.0, w: 1.1, h: 0.9, d: 1.1, ry: -a, color: coral3 });
        }
        mb.box({ x, y: 11, z, w: 0.2, h: 2.2, d: 0.2, color: wood });
      });

      // Gatehouse with a wide arch facing the town
      mb.box({ x: fx, y: 0, z: fz + D / 2, w: 9, h: 9, d: 3.4, color: coral3 });
      mb.box({ x: fx, y: 0.2, z: fz + D / 2 + 1.75, w: 5.2, h: 4.4, d: 0.5, color: '#4a3324' });
      mb.arch({ x: fx, y: 4.6, z: fz + D / 2 + 1.75, r: 2.6, thick: 0.8, depth: 0.6, color: coral2, seg: 14 });
      mb.box({ x: fx, y: 9, z: fz + D / 2, w: 7.4, h: 0.6, d: 3.8, color: coral2 });
      for (let i = 0; i < 5; i++) mb.box({ x: fx - 2.8 + i * 1.4, y: 9.6, z: fz + D / 2 + 1.4, w: 0.8, h: 0.9, d: 0.8, color: coral3 });

      // Courtyard: barracks, well, cannons, flag
      mb.box({ x: fx, y: 0.05, z: fz, w: W - 4, h: 0.15, d: D - 4, color: '#cbb894' });
      mb.box({ x: fx, y: 0.2, z: fz - D / 2 + 3, w: 22, h: 3.6, d: 4.6, color: coral3 });
      mb.box({ x: fx, y: 3.8, z: fz - D / 2 + 3, w: 22.4, h: 0.3, d: 5, color: coral2 });
      mb.box({ x: fx - W / 2 + 3.4, y: 0.2, z: fz + 1, w: 4.4, h: 3.2, d: 13, color: coral3 });
      mb.frustum({ x: fx + 6, y: 0.2, z: fz + 2, rb: 1.4, rt: 1.3, h: 1, sides: 12, color: coral2 });
      mb.disk({ x: fx + 6, y: 1.22, z: fz + 2, rx: 1.1, rz: 1.1, seg: 12, color: '#4d6d72' });
      [fz - 6, fz, fz + 6].forEach((z) => {
        mb.box({ x: fx + W / 2 - 3.4, y: 0.9, z, w: 2.6, h: 0.5, d: 0.6, color: '#3c3c40' });
        mb.box({ x: fx + W / 2 - 4.4, y: 0, z, w: 1.4, h: 0.9, d: 1.4, color: wood });
      });
      mb.box({ x: fx - 2, y: 0.2, z: fz + 4, w: 0.25, h: 12, d: 0.25, color: wood });
      mb.box({ x: fx - 0.3, y: 9.6, z: fz + 4, w: 3.4, h: 2, d: 0.1, color: '#b23a2e' });
      const palm = (x, z, s) => {
        const y = H(x, z) - 0.2, h = (6 + R() * 3) * s;
        mb.frustum({ x, y, z, rb: 0.34 * s, rt: 0.2 * s, h, sides: 6, color: '#7a5a3a', caps: false });
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * PI * 2 + R();
          mb.box({ x: x + Math.cos(a) * 1.5 * s, y: y + h - 0.5, z: z + Math.sin(a) * 1.5 * s, w: 3.4 * s, h: 0.18, d: 0.9 * s, ry: -a, color: U.shade('#4f7a32', 0.85 + R() * 0.3) });
        }
        mb.sphere({ x, y: y + h - 0.4, z, r: 0.8 * s, color: '#55803a', lat: 3, lon: 5 });
      };
      palm(fx - 5, fz - 5, 0.8); palm(fx + 7, fz - 7, 0.9); palm(fx - 8, fz + 8, 0.75);

      // --- Coral-stone town with wind towers and a small mosque ---
      const house = (x, z, w, d, h, tower) => {
        const y = H(x, z);
        mb.box({ x, y, z, w, h, d, color: U.shade(coral, 0.9 + R() * 0.2), top: coral3 });
        mb.box({ x, y: y + h, z, w: w + 0.4, h: 0.3, d: d + 0.4, color: coral2 });
        mb.box({ x: x - w / 2 + 1, y: y + 1, z: z + d / 2 + 0.05, w: 1.2, h: 1.9, d: 0.15, color: wood });
        if (tower) {
          mb.box({ x: x + w / 2 - 1.8, y: y + h, z: z - d / 2 + 1.8, w: 2.8, h: 6.5, d: 2.8, color: coral3 });
          mb.box({ x: x + w / 2 - 1.8, y: y + h + 5.6, z: z - d / 2 + 1.8, w: 3.1, h: 0.9, d: 3.1, color: coral2 });
          mb.box({ x: x + w / 2 - 1.8, y: y + h + 3.2, z: z - d / 2 + 1.8, w: 1.8, h: 2.2, d: 1.8, color: '#5c4630' });
        }
      };
      [[-30, -22, 9, 8, 4.4, true], [-38, -10, 8, 9, 4.8, false], [-32, 4, 10, 7, 4.2, true],
       [-40, 16, 8, 8, 4.6, false], [-30, 26, 9, 7, 4.2, false], [-46, 0, 7, 7, 4, false]]
        .forEach(([x, z, w, d, h, t]) => house(x, z, w, d, h, t));
      mb.box({ x: -46, y: H(-46, -26), z: -26, w: 12, h: 5, d: 10, color: coral3, top: '#efe6d2' });
      mb.sphere({ x: -46, y: H(-46, -26) + 5, z: -26, r: 3.2, sy: 0.95, color: '#efe6d2' });
      mb.frustum({ x: -40, y: H(-40, -26), z: -22, rb: 1.2, rt: 1, h: 10, sides: 8, color: coral3 });
      mb.sphere({ x: -40, y: H(-40, -26) + 10, z: -22, r: 1.2, sy: 0.9, color: '#efe6d2' });
      for (let i = 0; i < 34; i++) {
        const x = -62 + R() * 34, z = -54 + R() * 108;
        if (H(x, z) > 6) continue;
        palm(x, z, 0.8 + R() * 0.5);
      }

      // --- Harbor: jetty and dhows ---
      mb.box({ x: 37, y: 0.1, z: 4, w: 14, h: 0.5, d: 5, color: '#c8b894' });
      const dhow = (x, z, s, ry) => {
        mb.box({ x, y: -0.1, z, w: 3 * s, h: 1.3 * s, d: 10 * s, ry, color: '#7a5434', top: '#8c6642' });
        mb.box({ x, y: 1.2 * s, z, w: 0.2, h: 9 * s, d: 0.2, ry, color: '#5a3d22' });
        mb.gable({ x, y: 1.4 * s, z: z - 0.4 * s, w: 6 * s, h: 8 * s, len: 0.1, ry: ry + PI / 2, color: '#f2ead8' });
      };
      dhow(44, -14, 1, 0.2); dhow(52, 12, 1.2, -0.3); dhow(62, -4, 0.9, 0.5); dhow(72, 20, 1.1, 0.1);
    },
    pois: [
      { id: 'fort', vr: { stand: [10, 20] }, name: 'The Portuguese Fort', pos: [-12, 13, 0], view: { target: [-12, 5, 0], theta: 0.9, phi: 1.2, radius: 46 },
        text: 'Khor Fakkan\'s fort was built in the 16th century, when Portugal controlled the sea routes between the Gulf and India. Its compact plan, thick coral-stone walls and round bastions were designed to resist cannon fire.' },
      { id: 'bastions', name: 'Round Bastions & Walls', pos: [3, 12, 13], view: { target: [1, 5, 11], theta: 0.8, phi: 1.2, radius: 26 },
        text: 'The four round corner towers let defenders fire along the walls with no blind spots. Builders used local coral rock and limestone, so European military plans were carried out in Gulf materials and by local craftsmen.' },
      { id: 'courtyard', vr: { stand: [-12, 7], y: 0.2 }, name: 'Courtyard & Garrison', pos: [-12, 8, 0], view: { target: [-12, 2, 0], theta: 0.3, phi: 0.95, radius: 22 },
        text: 'Inside the walls were barracks, stores and a well — enough to hold out during a siege. The fort guarded the harbor rather than housing families, and a small garrison watched the trade routes through the Gulf of Oman.' },
      { id: 'harbor', name: 'Harbor & Dhows', pos: [46, 9, 6], view: { target: [44, 1, 4], theta: -1.1, phi: 1.12, radius: 38 },
        text: 'Khor Fakkan means "the creek of two jaws", named for the bay between the mountains. Dhows sheltered here from the monsoon, loading dates, fish and pearls, and the harbor made the town a valuable prize for rival powers.' },
      { id: 'town', name: 'Coral-Stone Town', pos: [-42, 9, 16], view: { target: [-42, 4, 16], theta: 0.7, phi: 1.15, radius: 32 },
        text: 'Around the fort stood a town of coral-stone houses with flat roofs and wind towers. The barajeel towers caught the sea breeze and funneled it down into the rooms, cooling homes without electricity.' },
      { id: 'mountains', name: 'The Hajar Mountains', pos: [-70, 26, -30], view: { target: [-65, 18, -30], theta: 1.15, phi: 1.2, radius: 66 },
        text: 'The Hajar Mountains rise sharply behind the coast, cutting Khor Fakkan off from the interior. The mountains bring cool air at night, and their wadis carry flash floods that once fed the town\'s palm gardens.' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* AL-JAZIRAT AL-HAMRA — pearl village, courtyards, wind towers, dhows */
  /* ------------------------------------------------------------------ */
  const alJaziratAlHamra = {
    id: 'al-jazirat-al-hamra', vrScale: 1.5, title: 'Al-Jazirat Al-Hamra — Pearl Village',
    sky: 'linear-gradient(180deg,#8fc0d8 0%,#dfeae6 46%,#f6e6c8 100%)',
    light: { sun: [0.5, 0.76, 0.4], sunColor: '#fff4de', sky: '#dceef4', ground: '#c2a374' },
    fog: { color: '#e7eee6', density: 0.0034 },
    camera: { target: [-6, 7, 0], theta: 0.8, phi: 1.1, radius: 100, minRadius: 12, maxRadius: 280 },
    build(mb, U) {
      const R = U.rng(88);
      const coral = '#d8c39b', coral2 = '#c6ad82', coral3 = '#e6d6b4', wood = '#6d4a2e';
      const H = (x, z) => {
        if (x > 34) return -2;
        return 0.55 * Math.sin(x * 0.07) * Math.cos(z * 0.06) + smooth(34, 16, x) * 0.6 + smooth(60, 140, -x) * 2.6;
      };
      this.heightAt = H;
      mb.terrain({
        size: 400, seg: 100, height: H,
        color: (x, z, y) => {
          if (x > 34) return '#2f6f8f';
          const inland = smooth(-34, -66, x);
          const soil = U.mix('#cd8a5e', '#b06c42', Math.min(1, (y + 1) / 4));
          const scrub = U.mix('#c4a273', '#a9a06b', Math.min(1, (y + 1) / 3));
          return U.mix(soil, scrub, inland);
        }
      });

      // The Gulf
      mb.box({ x: 130, y: -0.7, z: 0, w: 190, h: 0.62, d: 400, color: '#2f6f8f', top: '#4589a9' });
      for (let i = 0; i < 24; i++) {
        const x = 36 + R() * 120, z = -180 + R() * 360;
        mb.box({ x, y: -0.02, z, w: 2.2 + R() * 3, h: 0.06, d: 0.32, color: '#d3e9ee' });
      }

      // --- Courtyard houses with barjeel wind towers ---
      const house = (x, z, w, d, h, tower) => {
        const y = H(x, z), t = 0.7;
        mb.box({ x, y, z: z - d / 2, w, h, d: t, color: coral });
        mb.box({ x: x - w / 4 - 1.1, y, z: z + d / 2, w: w / 2 - 2.2, h, d: t, color: coral });
        mb.box({ x: x + w / 4 + 1.1, y, z: z + d / 2, w: w / 2 - 2.2, h, d: t, color: coral });
        mb.box({ x: x - w / 2, y, z, w: t, h, d, color: coral });
        mb.box({ x: x + w / 2, y, z, w: t, h, d, color: coral });
        mb.box({ x, y, z: z - d / 2 + 2, w: w - 1.4, h: h - 0.4, d: 3.4, color: coral2, top: coral3 });
        mb.box({ x: x - w / 2 + 2, y, z: z + 0.5, w: 3.4, h: h - 0.6, d: d - 5, color: coral2, top: coral3 });
        mb.box({ x: x + 1.1, y: y + 0.2, z: z + d / 2 + 0.05, w: 2.2, h: 2.6, d: 0.2, color: wood });
        mb.box({ x: x + w / 4, y: y + h - 0.2, z: z + d / 4, w: w / 2, h: 0.16, d: d / 2, color: '#a8895c' });
        if (tower) {
          const tx = x + w / 2 - 1.9, tz = z - d / 2 + 1.9;
          mb.box({ x: tx, y: y + h - 0.4, z: tz, w: 2.8, h: 7.2, d: 2.8, color: coral3 });
          mb.box({ x: tx, y: y + h + 6.8, z: tz, w: 3.1, h: 0.6, d: 3.1, color: coral2 });
          mb.box({ x: tx, y: y + h + 3.4, z: tz, w: 1.7, h: 2.6, d: 1.7, color: '#57402b' });
          [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([ox, oz]) => {
            mb.box({ x: tx + ox, y: y + h + 5.2, z: tz + oz, w: 0.5, h: 2.4, d: 0.5, color: coral3 });
          });
        }
      };
      [[-8, 0, 11, 10, 4.6, true], [-24, 9, 9, 9, 4.2, false], [-2, -16, 10, 8, 4, true],
       [-22, -12, 8, 9, 4.4, false], [-34, 2, 9, 8, 4, true], [4, 15, 8, 9, 3.8, false],
       [-14, 20, 9, 8, 4, false], [6, -4, 7, 8, 3.6, false], [-18, -2, 8, 8, 4.2, false],
       [-4, 6, 7, 7, 4, true], [-30, -22, 8, 8, 4, false], [12, 8, 7, 7, 3.6, false],
       [-36, 16, 7, 7, 3.8, false], [-10, -26, 9, 8, 4.2, true], [-20, 26, 7, 7, 3.6, false]]
        .forEach(([x, z, w, d, h, t]) => house(x, z, w, d, h, t));

      // Mosque and majlis
      mb.box({ x: -30, y: H(-30, 26), z: 26, w: 11, h: 4.4, d: 9, color: coral3, top: '#efe6d2' });
      mb.sphere({ x: -30, y: H(-30, 26) + 4.4, z: 26, r: 2.8, sy: 0.95, color: '#efe6d2' });
      mb.frustum({ x: -24, y: H(-24, 30), z: 30, rb: 1.1, rt: 0.9, h: 9, sides: 8, color: coral3 });
      mb.sphere({ x: -24, y: H(-24, 30) + 9, z: 30, r: 1.1, sy: 0.9, color: '#efe6d2' });
      mb.box({ x: -14, y: H(-14, 28), z: 28, w: 7, h: 3.2, d: 5, color: coral2, top: coral3 });
      mb.box({ x: -14, y: H(-14, 28) + 1.1, z: 30.6, w: 1.6, h: 1.9, d: 0.2, color: wood });

      // --- Watchtower on the rise behind the village ---
      const tw = { x: 22, z: -28, y: H(22, -28) };
      mb.frustum({ x: tw.x, y: tw.y, z: tw.z, rb: 3, rt: 2.6, h: 10, sides: 14, color: coral });
      mb.frustum({ x: tw.x, y: tw.y + 10, z: tw.z, rb: 3.3, rt: 3.3, h: 0.6, sides: 14, color: coral3 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2;
        mb.box({ x: tw.x + Math.cos(a) * 2.9, y: tw.y + 10.6, z: tw.z + Math.sin(a) * 2.9, w: 0.9, h: 0.8, d: 0.9, ry: -a, color: coral3 });
      }
      mb.box({ x: tw.x, y: tw.y + 11, z: tw.z, w: 0.2, h: 2.4, d: 0.2, color: wood });

      // Well and palm grove
      mb.frustum({ x: -40, y: H(-40, 8), z: 8, rb: 1.6, rt: 1.5, h: 0.9, sides: 12, color: coral2 });
      mb.disk({ x: -40, y: H(-40, 8) + 1.0, z: 8, rx: 1.2, rz: 1.2, seg: 12, color: '#4d6d72' });
      mb.box({ x: -40, y: H(-40, 8), z: 8, w: 0.15, h: 2.6, d: 0.15, color: wood });
      mb.box({ x: -39.2, y: H(-40, 8) + 2.5, z: 8, w: 1.6, h: 0.15, d: 0.15, color: wood });
      const palm = (x, z, s) => {
        const y = H(x, z) - 0.2, h = (6 + R() * 3) * s;
        mb.frustum({ x, y, z, rb: 0.34 * s, rt: 0.2 * s, h, sides: 6, color: '#7a5a3a', caps: false });
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * PI * 2 + R();
          mb.box({ x: x + Math.cos(a) * 1.5 * s, y: y + h - 0.5, z: z + Math.sin(a) * 1.5 * s, w: 3.4 * s, h: 0.18, d: 0.9 * s, ry: -a, color: U.shade('#4f7a32', 0.85 + R() * 0.3) });
        }
        mb.sphere({ x, y: y + h - 0.4, z, r: 0.8 * s, color: '#55803a', lat: 3, lon: 5 });
      };
      for (let i = 0; i < 34; i++) {
        const x = -62 + R() * 24, z = -34 + R() * 68;
        palm(x, z, 0.85 + R() * 0.5);
      }
      palm(-16, 8, 1); palm(-27, -4, 0.9); palm(2, 8, 0.85); palm(-38, 20, 1.1);

      // dry scrub on the gravel plain behind the village
      for (let i = 0; i < 30; i++) {
        const x = -72 + R() * 32, z = -62 + R() * 124;
        mb.sphere({ x, y: H(x, z), z, r: 0.7 + R() * 1.2, sy: 0.5, lat: 3, lon: 5, color: U.shade('#8f9455', 0.82 + R() * 0.32) });
      }

      // --- Pearling dhows and a jetty ---
      mb.box({ x: 35, y: 0.1, z: 6, w: 10, h: 0.4, d: 4, color: '#cbb894' });
      const dhow = (x, z, s, ry) => {
        mb.box({ x, y: -0.1, z, w: 2.8 * s, h: 1.2 * s, d: 9 * s, ry, color: '#7a5434', top: '#8c6642' });
        mb.box({ x, y: 1.1 * s, z, w: 0.18, h: 8 * s, d: 0.18, ry, color: '#5a3d22' });
        mb.gable({ x, y: 1.3 * s, z: z - 0.4 * s, w: 5.4 * s, h: 7 * s, len: 0.1, ry: ry + PI / 2, color: '#f2ead8' });
      };
      dhow(44, -12, 1, 0.25); dhow(54, 14, 1.1, -0.35); dhow(66, -2, 0.85, 0.5);
      dhow(48, 26, 0.8, -0.15); dhow(74, 22, 1, 0.2);
    },
    pois: [
      { id: 'courtyard', vr: { stand: [-8, 12], y: 0.2 }, name: 'The Courtyard Home', pos: [-8, 8, 0], view: { target: [-8, 3, 0], theta: 0.75, phi: 1.15, radius: 28 },
        text: 'A courtyard house turns its back on the street and opens inward. High walls and carved wooden screens gave the family privacy, while the shaded yard stayed cooler than the lanes outside and served as an outdoor room.' },
      { id: 'barjeel', name: 'The Wind Tower (Barjeel)', pos: [-4, 13, -3], view: { target: [-4, 8, -3], theta: 0.5, phi: 1.18, radius: 18 },
        text: 'The barjeel catches sea breezes from any direction and funnels them down into the rooms below, while hot air escapes through the open top. This passive cooling kept houses comfortable long before air conditioning.' },
      { id: 'mosque', name: 'Mosque & Majlis', pos: [-30, 10, 26], view: { target: [-30, 5, 26], theta: 0.9, phi: 1.15, radius: 26 },
        text: 'The mosque and the majlis were the social heart of the village. Men gathered in the majlis to settle disputes, share news and poetry, and welcome travellers; the mosque marked prayer times for the whole community.' },
      { id: 'dhows', name: 'Pearling Dhows', pos: [46, 8, 10], view: { target: [44, 1, 8], theta: -1.1, phi: 1.12, radius: 34 },
        text: 'From May to September the pearling fleet sailed out with divers, rope pullers and cooks. A diver stayed underwater for a minute or more, filling a basket with oysters; the pearls were sold in the Gulf and as far away as India.' },
      { id: 'palms', name: 'Palm Grove & Well', pos: [-46, 11, -16], view: { target: [-46, 5, -16], theta: 0.7, phi: 1.15, radius: 32 },
        text: 'Date palms gave shade, fruit, fronds for roofs and fibre for rope. The village well and the groves made life possible on this dry coast, and the reddish soil gave Al-Jazirat Al-Hamra — "the Red Island" — its name.' },
      { id: 'tower', name: 'The Watchtower', pos: [22, 14, -28], view: { target: [22, 6, -28], theta: 0.9, phi: 1.2, radius: 26 },
        text: 'A small watchtower stood on the rise behind the houses. From here lookouts could see pearling boats returning, fishing dhows, and any ship that might threaten the village — a reminder that the coast was both a living and a frontier.' }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* DHAYAH FORT — hilltop stronghold, palm groves, mountains, the coast  */
  /* ------------------------------------------------------------------ */
  const dhayahFort = {
    id: 'dhayah-fort', vrScale: 2, title: 'Dhayah Fort — The Hilltop Stronghold',
    sky: 'linear-gradient(180deg,#7fb2d2 0%,#dbe6dd 48%,#f4e2c2 100%)',
    light: { sun: [0.55, 0.72, 0.4], sunColor: '#fff2d8', sky: '#dceaf2', ground: '#c0a377' },
    fog: { color: '#e6e5d8', density: 0.003 },
    camera: { target: [0, 30, 0], theta: 0.75, phi: 1.05, radius: 180, minRadius: 18, maxRadius: 340 },
    build(mb, U) {
      const R = U.rng(99);
      const adobe = '#c9a97c', adobe2 = '#b8946a', adobe3 = '#dcc29a', wood = '#6b4a2f';
      const H = (x, z) => {
        const d = Math.hypot(x, z);
        const hill = 44 * Math.exp(-Math.pow(d / 40, 2));
        const mtn = smooth(100, 180, -x) * (12 + 8 * Math.sin(z * 0.03 + 0.8));
        return hill + mtn + 0.5 * Math.sin(x * 0.1) * Math.cos(z * 0.09) * smooth(6, 26, d);
      };
      this.heightAt = H;
      const topY = H(0, 0), fy = topY + 0.4;
      mb.terrain({
        size: 440, seg: 120, height: H,
        color: (x, z, y) => {
          if (y > 30) return U.mix('#a9835e', '#c3a077', Math.min(1, (y - 30) / 14));
          if (y > 8) return U.mix('#b99b74', '#cbb08a', Math.min(1, y / 40));
          if (x > 150) return '#d8c8a4';
          return U.mix('#d8c6a4', '#c8b28c', (Math.sin(x * 0.2) * Math.cos(z * 0.18) + 1) / 2);
        }
      });

      // The sea to the east and the coastal plain
      mb.box({ x: 182, y: -0.7, z: 0, w: 76, h: 0.62, d: 440, color: '#2f6f8f', top: '#4589a9' });
      for (let i = 0; i < 20; i++) {
        const x = 146 + R() * 60, z = -200 + R() * 400;
        mb.box({ x, y: -0.02, z, w: 2.2 + R() * 3, h: 0.06, d: 0.32, color: '#d3e9ee' });
      }

      // Summit platform and the fort
      mb.box({ x: 0, y: topY - 0.8, z: 0, w: 26, h: 1.2, d: 22, color: '#cdb489', top: '#dcc59c' });
      mb.box({ x: 0, y: fy, z: -8, w: 20, h: 6, d: 1.8, color: adobe });
      mb.box({ x: -6.3, y: fy, z: 8, w: 7.4, h: 6, d: 1.8, color: adobe });
      mb.box({ x: 6.3, y: fy, z: 8, w: 7.4, h: 6, d: 1.8, color: adobe });
      mb.box({ x: -10, y: fy, z: 0, w: 1.8, h: 6, d: 16, color: adobe });
      mb.box({ x: 10, y: fy, z: 0, w: 1.8, h: 6, d: 16, color: adobe });

      const crenel = (x0, z0, x1, z1, y, n) => {
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          mb.box({ x: x0 + (x1 - x0) * t, y, z: z0 + (z1 - z0) * t, w: 1, h: 0.9, d: 1, color: adobe3 });
        }
      };
      crenel(-10, -8, 10, -8, fy + 6, 9);
      crenel(-10, 8, -2.6, 8, fy + 6, 4);
      crenel(2.6, 8, 10, 8, fy + 6, 4);
      crenel(-10, -8, -10, 8, fy + 6, 8);
      crenel(10, -8, 10, 8, fy + 6, 8);

      [[-10, -8], [10, -8], [10, 8]].forEach(([x, z]) => {
        mb.frustum({ x, y: fy, z, rb: 3, rt: 2.7, h: 8.4, sides: 14, color: adobe });
        mb.frustum({ x, y: fy + 8.4, z, rb: 3.3, rt: 3.3, h: 0.6, sides: 14, color: adobe3 });
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * PI * 2;
          mb.box({ x: x + Math.cos(a) * 2.9, y: fy + 9, z: z + Math.sin(a) * 2.9, w: 0.9, h: 0.8, d: 0.9, ry: -a, color: adobe3 });
        }
      });

      // Gatehouse
      mb.box({ x: 0, y: fy, z: 8, w: 7, h: 9, d: 3, color: adobe3 });
      mb.box({ x: 0, y: fy + 9, z: 8, w: 7.6, h: 0.6, d: 3.6, color: adobe2 });
      for (let i = 0; i < 5; i++) mb.box({ x: -2.8 + i * 1.4, y: fy + 9.6, z: 9.6, w: 0.8, h: 0.9, d: 0.8, color: adobe3 });
      mb.box({ x: 0, y: fy + 0.2, z: 9.5, w: 3.6, h: 4.2, d: 0.4, color: '#5c4330' });
      mb.arch({ x: 0, y: fy + 4.4, z: 9.6, r: 1.8, thick: 0.5, depth: 0.5, color: adobe3, seg: 10 });

      // Interior: courtyard, storerooms, well, flag
      mb.box({ x: 0, y: fy + 0.02, z: 0, w: 17, h: 0.1, d: 13, color: '#c6ab80' });
      mb.box({ x: 0, y: fy + 0.1, z: -5, w: 16, h: 3.4, d: 4.2, color: adobe3 });
      mb.box({ x: 0, y: fy + 3.5, z: -5, w: 16.4, h: 0.3, d: 4.6, color: adobe2 });
      mb.box({ x: -8, y: fy + 0.1, z: 1, w: 2.8, h: 2.8, d: 8, color: adobe3 });
      mb.frustum({ x: 5, y: fy + 0.1, z: 3, rb: 1.2, rt: 1.1, h: 0.9, sides: 12, color: adobe2 });
      mb.disk({ x: 5, y: fy + 1.05, z: 3, rx: 0.95, rz: 0.95, seg: 12, color: '#4d6d72' });
      mb.box({ x: 4, y: fy + 0.1, z: -2, w: 1.6, h: 1.4, d: 1.6, color: adobe2 });
      mb.box({ x: 4, y: fy + 1.5, z: -2, w: 1.9, h: 0.2, d: 1.9, color: adobe3 });
      mb.box({ x: 0, y: fy + 0.2, z: 0, w: 0.22, h: 11, d: 0.22, color: wood });
      mb.box({ x: 1.7, y: fy + 9, z: 0, w: 3.2, h: 1.9, d: 0.1, color: '#b23a2e' });

      // Zig-zag path climbing the hill from the south
      for (let i = 0; i < 22; i++) {
        const t = i / 21;
        const z = 62 - t * 52, x = 3 * Math.sin(t * PI * 1.6);
        mb.box({ x, y: H(x, z) + 0.15, z, w: 5, h: 0.35, d: 3.6, color: '#d3bd97' });
      }

      // Palm groves and the village at the foot of the hill
      const palm = (x, z, s) => {
        const y = H(x, z) - 0.2, h = (6 + R() * 3) * s;
        mb.frustum({ x, y, z, rb: 0.34 * s, rt: 0.2 * s, h, sides: 6, color: '#7a5a3a', caps: false });
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * PI * 2 + R();
          mb.box({ x: x + Math.cos(a) * 1.5 * s, y: y + h - 0.5, z: z + Math.sin(a) * 1.5 * s, w: 3.4 * s, h: 0.18, d: 0.9 * s, ry: -a, color: U.shade('#4f7a32', 0.85 + R() * 0.3) });
        }
        mb.sphere({ x, y: y + h - 0.4, z, r: 0.8 * s, color: '#55803a', lat: 3, lon: 5 });
      };
      for (let i = 0; i < 70; i++) {
        const a = R() * PI * 2, d = 50 + R() * 70;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (H(x, z) > 7) continue;
        palm(x, z, 0.8 + R() * 0.6);
      }
      const house = (x, z) => {
        const y = H(x, z), h = 4 + R() * 1.6, w = 6 + R() * 2, d = 6 + R() * 2;
        mb.box({ x, y, z, w, h, d, color: U.shade(adobe, 0.9 + R() * 0.2), top: adobe3 });
        mb.box({ x, y: y + h, z, w: w + 0.5, h: 0.3, d: d + 0.5, color: adobe2 });
        mb.box({ x, y: y + 0.1, z: z + d / 2 + 0.05, w: 1.3, h: 2.1, d: 0.2, color: '#5c4330' });
      };
      [[-34, 46], [-24, 54], [-12, 58], [2, 60], [16, 56], [30, 48], [40, 34], [-46, 32], [-52, 16]]
        .forEach(([x, z]) => house(x, z));
      for (let i = 0; i < 12; i++) {
        const z = 26 + i * 5, x = -20 - i * 1.4;
        mb.box({ x, y: H(x, z) + 0.05, z, w: 1.1, h: 0.22, d: 6.4, color: '#5d94a6' });
      }
    },
    pois: [
      { id: 'fort', vr: { stand: [0, 16] }, name: 'The Hilltop Fort', pos: [0, 56, 0], view: { target: [0, 49, 0], theta: 0.75, phi: 1.18, radius: 42 },
        text: 'Dhayah Fort is the only surviving hilltop fort in the UAE. From the summit its defenders could see the palm groves, the coast and any ship approaching, which made it the natural last stronghold of the Al Qasimi rulers.' },
      { id: 'walls', name: 'Adobe Walls & Towers', pos: [9, 52, 7], view: { target: [7, 47, 6], theta: 0.9, phi: 1.2, radius: 20 },
        text: 'The fort is built of mud brick and stone plastered with adobe. Thick walls, round corner towers and battlements gave protection against cannon fire, while the small rooms inside stored food and water for a siege.' },
      { id: 'courtyard', vr: { stand: [0, 3], y: 44.6 }, name: 'Inside the Fort', pos: [0, 48, 0], view: { target: [0, 46, 0], theta: 0.3, phi: 0.95, radius: 15 },
        text: 'The courtyard held a well, a date store and simple rooms for the garrison. Life here was cramped and exposed, but the height gave cool breezes and a clear view of the palm gardens that fed the fort.' },
      { id: 'palms', name: 'Palm Groves & Falaj', pos: [-45, 9, 45], view: { target: [-42, 4, 42], theta: 0.7, phi: 1.15, radius: 38 },
        text: 'The groves below the hill provided dates, shade and building material. A falaj channel carried water from the mountains to the palms and houses, turning a dry gravel plain into a green oasis.' },
      { id: 'siege', name: 'The Siege of 1819', pos: [40, 14, 34], view: { target: [30, 7, 26], theta: -0.7, phi: 1.15, radius: 42 },
        text: 'In 1819 British forces besieged Dhayah after the Al Qasimi resistance. The fort held out for several days before it fell — an event remembered in Emirati heritage as a symbol of defiance and of the region\'s turbulent early modern history.' },
      { id: 'mountains', name: 'The Hajar Mountains', pos: [-72, 30, -70], view: { target: [-66, 22, -66], theta: 1.1, phi: 1.2, radius: 66 },
        text: 'The Hajar Mountains rise to the west, their wadis and gravel plains feeding the springs that made settlement possible. Dhayah sits where the mountains meet the sea, guarding the route between the interior and the coast.' }
    ]
  };

  /* The registry is keyed by each scene's own `id`, which is the
     civilization id used by the router (e.g. 'taj-mahal'). */
  global.CIV_SCENES = {};
  [egypt, rome, maya, tajMahal, petra, khorFakkan, alJaziratAlHamra, dhayahFort].forEach((s) => {
    global.CIV_SCENES[s.id] = s;
  });
})(window);
