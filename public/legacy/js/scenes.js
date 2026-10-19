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

  global.CIV_SCENES = { egypt, rome, maya };
})(window);
