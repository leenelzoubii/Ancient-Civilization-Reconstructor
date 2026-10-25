/* =====================================================================
   AI Artifact Reconstruction engine
   ---------------------------------------------------------------------
   Estimates the complete shape and surface of a broken artifact from a
   single photo plus optional reference images. Runs entirely in the
   browser (no upload to any server).

   Pipeline
     1. Normalise   – resize the photo and add margin around it
     2. Segment     – separate the artifact from a plain background
     3. Symmetry    – search for the vertical axis of symmetry that best
                      matches the artifact with its own mirror image
     4. Silhouette  – rebuild the outline: mirror each row's width and
                      "close" chips and notches in the profile
     5. Fill        – restore missing pixels: first copy the matching
                      pixel from the mirrored side, then grow colour
                      inward from the edges (inpainting)
     6. References  – learn a colour palette from reference images and
                      blend restored areas toward it
     7. Blend       – smooth seams between original and restored areas
   ===================================================================== */
window.Reconstructor = (function () {
  'use strict';

  const MAX = 440;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This image could not be opened. Please try a JPG or PNG file.'));
      img.src = src;
    });
  }

  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- 1. Normalise ---------- */
  function normalise(img) {
    const s = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.max(8, Math.round(img.width * s)), h = Math.max(8, Math.round(img.height * s));
    const tmp = makeCanvas(w, h), tctx = tmp.getContext('2d', { willReadFrequently: true });
    tctx.drawImage(img, 0, 0, w, h);
    const bg = estimateBackground(tctx.getImageData(0, 0, w, h).data, w, h);
    const pad = Math.round(Math.max(w, h) * 0.18);
    const c = makeCanvas(w + pad * 2, h + pad * 2), ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = `rgb(${bg.rgb.join(',')})`;
    if (!bg.transparent) ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(tmp, pad, pad);
    return { canvas: c, bg, pad };
  }

  function estimateBackground(d, w, h) {
    const R = [], G = [], B = [];
    let transparent = 0, n = 0;
    const take = (x, y) => {
      const i = (y * w + x) * 4;
      n++;
      if (d[i + 3] < 30) { transparent++; return; }
      R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]);
    };
    for (let x = 0; x < w; x += 2) { take(x, 0); take(x, 1); take(x, h - 1); take(x, h - 2); }
    for (let y = 0; y < h; y += 2) { take(0, y); take(1, y); take(w - 1, y); take(w - 2, y); }
    const med = (a) => { if (!a.length) return 255; a.sort((p, q) => p - q); return a[a.length >> 1]; };
    return { rgb: [med(R), med(G), med(B)], transparent: transparent > n * 0.5 };
  }

  /* ---------- 2. Segment ---------- */
  function segment(d, w, h, bg, sensitivity) {
    // Otsu's method picks the colour-distance threshold that best separates
    // background from object; the sensitivity slider scales it.
    const dist = new Float32Array(w * h), hist = new Float64Array(443);
    for (let i = 0, p = 0; i < dist.length; i++, p += 4) {
      const dr = d[p] - bg.rgb[0], dg = d[p + 1] - bg.rgb[1], db = d[p + 2] - bg.rgb[2];
      dist[i] = Math.sqrt(dr * dr + dg * dg + db * db);
      if (d[p + 3] >= 40) hist[Math.min(442, Math.round(dist[i]))]++;
    }
    let total = 0, sum = 0;
    for (let t = 0; t < 443; t++) { total += hist[t]; sum += t * hist[t]; }
    let wB = 0, sB = 0, best = 0, otsu = 30;
    for (let t = 0; t < 443; t++) {
      wB += hist[t]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sB += t * hist[t];
      const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; otsu = t; }
    }
    // Hysteresis: clearly different pixels seed the object, then the region
    // grows into connected pixels that are only slightly different (pale
    // highlights on the object are kept, flat background is not).
    const strong = Math.max(10, Math.min(120, otsu));
    const weak = Math.max(6, strong * (0.6 - sensitivity / 100 * 0.4));
    let m = new Uint8Array(w * h);
    const queue = [];
    for (let i = 0, p = 0; i < m.length; i++, p += 4) {
      if (d[p + 3] < 40) continue;
      if (bg.transparent || dist[i] > strong) { m[i] = 1; queue.push(i); }
    }
    for (let q = 0; q < queue.length; q++) {
      const k = queue[q], x = k % w;
      for (const j of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, k - w, k + w]) {
        if (j < 0 || j >= m.length || m[j] || d[j * 4 + 3] < 40 || dist[j] <= weak) continue;
        m[j] = 1; queue.push(j);
      }
    }
    // majority filter removes speckle noise
    for (let pass = 0; pass < 2; pass++) {
      const o = new Uint8Array(w * h);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += m[(y + dy) * w + x + dx];
        o[y * w + x] = s >= 5 ? 1 : 0;
      }
      m = o;
    }
    // keep the largest connected pieces (fragments of the same object)
    const label = new Int32Array(w * h), sizes = [0];
    const stack = new Int32Array(w * h);
    for (let i = 0; i < m.length; i++) {
      if (!m[i] || label[i]) continue;
      const id = sizes.length; let sp = 0, size = 0;
      stack[sp++] = i; label[i] = id;
      while (sp) {
        const k = stack[--sp]; size++;
        const x = k % w, y = (k / w) | 0;
        if (x > 0 && m[k - 1] && !label[k - 1]) { label[k - 1] = id; stack[sp++] = k - 1; }
        if (x < w - 1 && m[k + 1] && !label[k + 1]) { label[k + 1] = id; stack[sp++] = k + 1; }
        if (y > 0 && m[k - w] && !label[k - w]) { label[k - w] = id; stack[sp++] = k - w; }
        if (y < h - 1 && m[k + w] && !label[k + w]) { label[k + w] = id; stack[sp++] = k + w; }
      }
      sizes.push(size);
    }
    const biggest = Math.max(0, ...sizes);
    for (let i = 0; i < m.length; i++) if (m[i] && sizes[label[i]] < biggest * 0.12) m[i] = 0;
    return m;
  }

  function bbox(m, w, h) {
    let minX = w, minY = h, maxX = -1, maxY = -1, count = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) {
      count++;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY, count };
  }

  /* ---------- 3. Symmetry axis search ---------- */
  function findAxis(m, w, h, bb) {
    // (a) robust estimate: the most common midpoint between the left and right
    //     edges of each row. Undamaged rows agree on the true centre, while
    //     damaged rows scatter, so the histogram peak ignores the damage.
    const bins = new Float32Array(w);
    for (let y = bb.minY; y <= bb.maxY; y++) {
      let l = -1, r = -1;
      for (let x = bb.minX; x <= bb.maxX; x++) if (m[y * w + x]) { if (l < 0) l = x; r = x; }
      if (l >= 0 && r - l > 3) bins[Math.round((l + r) / 2)] += 1;
    }
    let peak = Math.round((bb.minX + bb.maxX) / 2), pv = -1;
    for (let x = 2; x < w - 2; x++) {
      const v = bins[x - 2] + 2 * bins[x - 1] + 3 * bins[x] + 2 * bins[x + 1] + bins[x + 2];
      if (v > pv) { pv = v; peak = x; }
    }
    // (b) average the midpoints close to the peak for sub-pixel accuracy
    let sw = 0, sx = 0;
    for (let x = Math.max(0, peak - 3); x <= Math.min(w - 1, peak + 3); x++) { sw += bins[x]; sx += bins[x] * x; }
    const axis = sw ? sx / sw : peak;
    return { axis, score: symmetryScore(m, w, bb, axis) };
  }

  /* ---------- 4. Silhouette completion ---------- */
  function silhouette(m, w, h, bb, axis) {
    const rows = bb.maxY - bb.minY + 1;
    const hw = new Float32Array(rows).fill(-1);
    for (let y = bb.minY; y <= bb.maxY; y++) {
      let l = -1, r = -1;
      for (let x = 0; x < w; x++) if (m[y * w + x]) { if (l < 0) l = x; r = x; }
      if (l >= 0) hw[y - bb.minY] = Math.max(axis - l, r - axis);
    }
    // interpolate empty rows
    let last = -1;
    for (let i = 0; i < rows; i++) {
      if (hw[i] >= 0) {
        if (last >= 0 && i - last > 1) for (let k = last + 1; k < i; k++) hw[k] = hw[last] + (hw[i] - hw[last]) * (k - last) / (i - last);
        last = i;
      }
    }
    for (let i = 0; i < rows; i++) if (hw[i] < 0) hw[i] = 0;
    // morphological closing on the profile fills chips and notches
    const k = Math.max(2, Math.round(rows * 0.02));
    const dil = new Float32Array(rows), clo = new Float32Array(rows);
    for (let i = 0; i < rows; i++) { let v = 0; for (let j = Math.max(0, i - k); j <= Math.min(rows - 1, i + k); j++) v = Math.max(v, hw[j]); dil[i] = v; }
    for (let i = 0; i < rows; i++) { let v = Infinity; for (let j = Math.max(0, i - k); j <= Math.min(rows - 1, i + k); j++) v = Math.min(v, dil[j]); clo[i] = Math.max(hw[i], v); }
    // (a) union of the artifact and its mirror image keeps gaps such as handles open
    const target = new Uint8Array(w * h);
    for (let y = bb.minY; y <= bb.maxY; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!m[i]) continue;
      target[i] = 1;
      const mx = Math.round(2 * axis - x);
      if (mx >= 0 && mx < w) target[y * w + mx] = 1;
    }
    // (b) where BOTH sides are damaged, extend the outline to the closed profile
    for (let y = bb.minY; y <= bb.maxY; y++) {
      const r = clo[y - bb.minY];
      let ext = -1;
      for (let x = 0; x < w; x++) if (target[y * w + x]) ext = Math.max(ext, Math.abs(x - axis));
      if (ext < 0 || r <= ext + 0.5) continue;
      for (let x = Math.max(0, Math.ceil(axis - r)); x <= Math.min(w - 1, Math.floor(axis + r)); x++) {
        if (Math.abs(x - axis) > ext) target[y * w + x] = 1;
      }
    }
    fillEnclosed(target, w, h);
    return target;
  }

  /* ---------- 6. Reference palette (k-means) ---------- */
  function paletteFrom(canvas, mask, k = 5) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const samples = [];
    const total = mask ? mask.reduce((a, b) => a + b, 0) : canvas.width * canvas.height;
    const step = Math.max(1, Math.floor(total / 3000));
    let seen = 0;
    for (let i = 0; i < canvas.width * canvas.height; i++) {
      if (mask && !mask[i]) continue;
      if (seen++ % step) continue;
      samples.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
    }
    if (!samples.length) return [];
    const cents = [];
    for (let i = 0; i < k; i++) cents.push(samples[Math.floor((i + 0.5) / k * samples.length)].slice());
    const assign = new Int32Array(samples.length);
    for (let it = 0; it < 10; it++) {
      samples.forEach((s, i) => {
        let bi = 0, bd = Infinity;
        cents.forEach((c, j) => { const dd = (s[0] - c[0]) ** 2 + (s[1] - c[1]) ** 2 + (s[2] - c[2]) ** 2; if (dd < bd) { bd = dd; bi = j; } });
        assign[i] = bi;
      });
      const sum = cents.map(() => [0, 0, 0, 0]);
      samples.forEach((s, i) => { const a = sum[assign[i]]; a[0] += s[0]; a[1] += s[1]; a[2] += s[2]; a[3]++; });
      sum.forEach((a, j) => { if (a[3]) cents[j] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
    }
    const counts = cents.map(() => 0);
    assign.forEach(a => counts[a]++);
    return cents.map((c, i) => ({ rgb: c.map(Math.round), weight: counts[i] / samples.length }))
      .filter(c => c.weight > 0.02).sort((a, b) => b.weight - a.weight);
  }

  /* ---------- Full pipeline ---------- */
  async function run(src, refSrcs, opts = {}, onStep = () => {}) {
    const sensitivity = opts.sensitivity ?? 50;
    const useSymmetry = opts.symmetry !== false;
    const t0 = performance.now();

    onStep(0, 'Preparing image');
    const img = await loadImage(src);
    const { canvas, bg } = normalise(img);
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const original = ctx.getImageData(0, 0, w, h);
    await sleep(260);

    onStep(1, 'Detecting the artifact');
    const mask = segment(original.data, w, h, bg, sensitivity);
    const bb = bbox(mask, w, h);
    if (bb.count < 400) throw new Error('No artifact could be found in this photo. Try a photo of the object on a plain, contrasting background, or adjust the detection sensitivity.');
    await sleep(260);

    onStep(2, 'Analysing symmetry');
    const sym = useSymmetry ? (opts.axis != null ? { axis: opts.axis, score: symmetryScore(mask, w, bb, opts.axis) } : findAxis(mask, w, h, bb)) : { axis: (bb.minX + bb.maxX) / 2, score: 0 };
    await sleep(260);

    onStep(3, 'Learning from reference images');
    const refPalettes = [];
    for (const rs of refSrcs) {
      try {
        const rimg = await loadImage(rs);
        const n = normalise(rimg);
        const rd = n.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, n.canvas.width, n.canvas.height).data;
        const rm = segment(rd, n.canvas.width, n.canvas.height, n.bg, 50);
        refPalettes.push(...paletteFrom(n.canvas, rm, 5));
      } catch (e) { /* skip unreadable reference */ }
    }
    const objectPalette = paletteFrom(canvas, mask, 5);
    await sleep(260);

    onStep(4, 'Rebuilding the shape');
    const target = useSymmetry ? silhouette(mask, w, h, bb, sym.axis) : closeHoles(mask, w, h, bb);
    await sleep(200);

    onStep(5, 'Restoring missing surface');
    const out = new ImageData(new Uint8ClampedArray(original.data), w, h);
    const D = out.data, O = original.data;
    const src2 = new Uint8Array(w * h); // 0 original, 1 mirrored, 2 inpainted, 255 not yet filled
    let missing = 0;
    for (let i = 0; i < w * h; i++) if (target[i] && !mask[i]) { src2[i] = 255; missing++; }
    // (a) mirror from the symmetric side
    if (useSymmetry) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (src2[i] !== 255) continue;
        const mx = Math.round(2 * sym.axis - x);
        if (mx < 0 || mx >= w) continue;
        const j = y * w + mx;
        if (mask[j]) { D[i * 4] = O[j * 4]; D[i * 4 + 1] = O[j * 4 + 1]; D[i * 4 + 2] = O[j * 4 + 2]; D[i * 4 + 3] = 255; src2[i] = 1; }
      }
    }
    // (b) inpaint the rest by growing colour inward from known pixels
    let frontier = [];
    for (let i = 0; i < w * h; i++) if (src2[i] === 255) frontier.push(i);
    let guard = 0;
    const rnd = mulberry(42);
    while (frontier.length && guard++ < 600) {
      const next = [], updates = [];
      for (const i of frontier) {
        const x = i % w, y = (i / w) | 0;
        let r = 0, g = 0, b = 0, c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = yy * w + xx;
          if (!target[j] || src2[j] === 255) continue;
          r += D[j * 4]; g += D[j * 4 + 1]; b += D[j * 4 + 2]; c++;
        }
        if (c >= 2) {
          const n = (rnd() - 0.5) * 7;
          updates.push([i, r / c + n, g / c + n, b / c + n]);
        } else next.push(i);
      }
      if (!updates.length) break;
      for (const [i, r, g, b] of updates) { D[i * 4] = r; D[i * 4 + 1] = g; D[i * 4 + 2] = b; D[i * 4 + 3] = 255; src2[i] = 2; }
      frontier = next;
    }
    for (const i of frontier) { const c = objectPalette[0] ? objectPalette[0].rgb : [150, 110, 80]; D[i * 4] = c[0]; D[i * 4 + 1] = c[1]; D[i * 4 + 2] = c[2]; D[i * 4 + 3] = 255; src2[i] = 2; }
    await sleep(200);

    onStep(6, 'Applying reference colours & blending');
    const pal = refPalettes.length ? refPalettes : [];
    if (pal.length) {
      for (let i = 0; i < w * h; i++) {
        if (src2[i] !== 2) continue;
        let best = pal[0].rgb, bd = Infinity;
        for (const p of pal) { const dd = (D[i * 4] - p.rgb[0]) ** 2 + (D[i * 4 + 1] - p.rgb[1]) ** 2 + (D[i * 4 + 2] - p.rgb[2]) ** 2; if (dd < bd) { bd = dd; best = p.rgb; } }
        D[i * 4] = D[i * 4] * 0.62 + best[0] * 0.38; D[i * 4 + 1] = D[i * 4 + 1] * 0.62 + best[1] * 0.38; D[i * 4 + 2] = D[i * 4 + 2] * 0.62 + best[2] * 0.38;
      }
    }
    // seam blending: soften restored pixels that touch original ones
    const copy = new Uint8ClampedArray(D);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!src2[i] || !target[i]) continue;
      let r = 0, g = 0, b = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const j = (y + dy) * w + x + dx;
        if (!target[j]) continue;
        r += copy[j * 4]; g += copy[j * 4 + 1]; b += copy[j * 4 + 2]; c++;
      }
      if (c) { D[i * 4] = r / c; D[i * 4 + 1] = g / c; D[i * 4 + 2] = b / c; }
    }
    ctx.putImageData(out, 0, 0);
    await sleep(200);

    // crop around the reconstructed object
    const tb = bbox(target, w, h);
    const mpx = Math.round(Math.max(tb.maxX - tb.minX, tb.maxY - tb.minY) * 0.08);
    const cx0 = Math.max(0, tb.minX - mpx), cy0 = Math.max(0, tb.minY - mpx);
    const cw = Math.min(w, tb.maxX + mpx + 1) - cx0, ch = Math.min(h, tb.maxY + mpx + 1) - cy0;
    const crop = (data) => {
      const c = makeCanvas(cw, ch);
      const cc = c.getContext('2d');
      if (!bg.transparent) { cc.fillStyle = `rgb(${bg.rgb.join(',')})`; cc.fillRect(0, 0, cw, ch); }
      const tmp = makeCanvas(w, h); tmp.getContext('2d').putImageData(data, 0, 0);
      cc.drawImage(tmp, cx0, cy0, cw, ch, 0, 0, cw, ch);
      return c;
    };
    const result = crop(out);
    const before = crop(original);
    // overlay highlighting restored regions
    const ov = new ImageData(new Uint8ClampedArray(D), w, h);
    for (let i = 0; i < w * h; i++) {
      if (!src2[i] || !target[i]) continue;
      const edge = isEdge(src2, target, w, h, i);
      const tint = edge ? [255, 255, 255] : (src2[i] === 1 ? [232, 167, 52] : [214, 92, 66]);
      const a = edge ? 0.9 : 0.5;
      ov.data[i * 4] = ov.data[i * 4] * (1 - a) + tint[0] * a;
      ov.data[i * 4 + 1] = ov.data[i * 4 + 1] * (1 - a) + tint[1] * a;
      ov.data[i * 4 + 2] = ov.data[i * 4 + 2] * (1 - a) + tint[2] * a;
    }
    const overlay = crop(ov);

    let mirrored = 0, painted = 0, total = 0;
    for (let i = 0; i < w * h; i++) { if (target[i]) total++; if (target[i] && src2[i] === 1) mirrored++; if (target[i] && src2[i] === 2) painted++; }
    const restoredPct = (mirrored + painted) / total * 100;
    const conf = Math.max(0.05, Math.min(0.98,
      (useSymmetry ? sym.score * 0.55 : 0.3) + (1 - restoredPct / 100) * 0.35 + Math.min(refSrcs.length, 3) * 0.035));
    onStep(7, 'Predicting the civilization');
    const prediction = predictCivilization(D, target, w, h, sym.axis);
    await sleep(260);
    onStep(8, 'Done');

    return {
      result, before, overlay,
      stats: {
        restoredPct, mirroredPct: mirrored / total * 100, paintedPct: painted / total * 100,
        symmetry: sym.score, axis: sym.axis, axisRange: [bb.minX, bb.maxX], useSymmetry,
        confidence: conf, references: refSrcs.length,
        palette: (pal.length ? pal : objectPalette).slice(0, 6),
        paletteSource: pal.length ? 'reference images' : 'the uploaded photo',
        ms: Math.round(performance.now() - t0), width: cw, height: ch,
        prediction
      }
    };
  }

  /* =================================================================
     Civilization prediction
     -----------------------------------------------------------------
     Compares measurable features of the reconstructed artifact with
     typical traits of each civilization's pottery:
       • Colour  – share of terracotta, black, blue, cream and deep-red
       • Shape   – height/width ratio, neck width, widest point,
                   how straight the sides are, and handles
     Each feature adds weighted evidence; scores are converted to
     probabilities with softmax.
     ================================================================= */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [hh * 60, s, l];
  }

  function predictCivilization(D, target, w, h, axis) {
    const bb = bbox(target, w, h);
    const rows = bb.maxY - bb.minY + 1, width = bb.maxX - bb.minX + 1;
    // ---- shape features
    const hw = [], runs = [];
    for (let y = bb.minY; y <= bb.maxY; y++) {
      let l = -1, r = -1, n = 0, prev = 0;
      for (let x = bb.minX; x <= bb.maxX; x++) {
        const v = target[y * w + x];
        if (v) { if (l < 0) l = x; r = x; if (!prev) n++; }
        prev = v;
      }
      hw.push(l < 0 ? 0 : (r - l) / 2); runs.push(n);
    }
    const maxHw = Math.max(...hw) || 1;
    const norm = hw.map(v => v / maxHw);
    const tMax = norm.indexOf(1) / rows;
    const top = norm.slice(0, Math.round(rows * 0.3));
    const neck = Math.min(...top.slice(Math.round(rows * 0.04)).concat([1]));
    const mid = norm.slice(Math.round(rows * 0.1), Math.round(rows * 0.9));
    const mean = mid.reduce((a, b) => a + b, 0) / Math.max(1, mid.length);
    const straight = Math.sqrt(mid.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, mid.length));
    const upper = runs.slice(0, Math.round(rows * 0.5));
    const handleRows = upper.filter(n => n >= 3).length / Math.max(1, upper.length);
    const aspect = rows / width;
    // ---- colour features
    let n = 0;
    const c = { terracotta: 0, black: 0, blue: 0, cream: 0, deepRed: 0, green: 0 };
    for (let i = 0; i < w * h; i += 2) {
      if (!target[i]) continue;
      const [H, S, L] = rgbToHsl(D[i * 4], D[i * 4 + 1], D[i * 4 + 2]);
      n++;
      if (L < 0.2) c.black++;
      else if (H >= 185 && H <= 250 && S > 0.2) c.blue++;
      else if (H >= 140 && H < 185 && S > 0.2) c.green++;
      else if ((H <= 14 || H >= 345) && S > 0.4 && L < 0.45) c.deepRed++;
      else if (H > 8 && H < 26 && S > 0.35 && L >= 0.3 && L < 0.62) c.terracotta++;
      else if (H >= 26 && H <= 50 && L >= 0.55 && S > 0.15) c.cream++;
    }
    for (const k in c) c[k] /= Math.max(1, n);

    // ---- weighted evidence
    const ev = { egypt: [], rome: [], maya: [] };
    const add = (civ, v, why) => { if (v > 0.05) ev[civ].push({ v, why }); };
    add('egypt', c.blue * 14, 'Blue painted decoration, typical of Egyptian pottery and faience');
    add('egypt', c.green * 10, 'Blue-green glaze colour similar to Egyptian faience');
    add('egypt', c.cream * 3, 'Pale buff/cream clay body like Nile and marl clay wares');
    add('egypt', (tMax > 0.25 && tMax < 0.6 && handleRows < 0.05 && neck < 0.85) ? 1.2 : 0, 'Rounded shoulder with no handles, like Egyptian storage jars');
    add('rome', c.black * 9, 'Black painted bands and patterns, common on Greco-Roman wares');
    add('rome', c.terracotta * 3.5, 'Orange-red terracotta clay typical of Roman amphorae');
    add('rome', Math.min(2.5, handleRows * 10), 'Two handles on the neck — the classic amphora form');
    add('rome', (neck < 0.6 && aspect > 1.2) ? 1.3 : 0, 'Tall shape with a narrow neck for storing wine or olive oil');
    add('maya', straight < 0.06 ? 2.8 : straight < 0.1 ? 1.2 : 0, 'Straight, cylindrical sides like Maya cylinder vases');
    add('maya', c.deepRed * 9, 'Deep red painted bands typical of Maya polychrome pottery');
    add('maya', (neck > 0.85 && aspect > 1.1) ? 1.4 : 0, 'No narrowed neck — a wide, open drinking vessel');
    add('maya', c.cream * 1.5, 'Warm orange-cream slip used on Classic Maya ceramics');

    const raw = {}, civs = ['egypt', 'rome', 'maya'];
    civs.forEach(k => raw[k] = ev[k].reduce((a, e) => a + e.v, 0));
    const T = 1.8, ex = civs.map(k => Math.exp(raw[k] / T)), sum = ex.reduce((a, b) => a + b, 0);
    const probs = {}; civs.forEach((k, i) => probs[k] = ex[i] / sum);
    const ranked = civs.slice().sort((a, b) => probs[b] - probs[a]);
    const best = ranked[0];
    return {
      civ: best, probs, ranked,
      reasons: ev[best].sort((a, b) => b.v - a.v).slice(0, 3).map(e => e.why),
      certain: probs[best] >= 0.6,
      features: { aspect, neck, tMax, straight, handleRows, colours: c }
    };
  }

  function symmetryScore(m, w, bb, c) {
    let inter = 0, n = 0;
    for (let y = bb.minY; y <= bb.maxY; y += 2) for (let x = bb.minX; x <= bb.maxX; x += 2) {
      if (!m[y * w + x]) continue;
      n++;
      const mx = Math.round(2 * c - x);
      if (mx >= 0 && mx < w && m[y * w + mx]) inter++;
    }
    return n ? inter / (2 * n - inter) : 0;
  }

  function closeHoles(m, w, h, bb) {
    // without symmetry: fill only enclosed gaps in each row and column
    const t = new Uint8Array(m);
    fillEnclosed(t, w, h);
    return t;
  }

  /* Fill background regions completely enclosed by the artifact (cracks, holes) */
  function fillEnclosed(t, w, h) {
    const outside = new Uint8Array(w * h), stack = [];
    const push = (i) => { if (!t[i] && !outside[i]) { outside[i] = 1; stack.push(i); } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (stack.length) {
      const k = stack.pop(), x = k % w, y = (k / w) | 0;
      if (x > 0) push(k - 1); if (x < w - 1) push(k + 1); if (y > 0) push(k - w); if (y < h - 1) push(k + w);
    }
    // fill only small enclosed gaps (cracks, chips); keep real openings such as handle loops
    let area = 0;
    for (let i = 0; i < t.length; i++) if (t[i]) area++;
    const limit = area * 0.006, seen = new Uint8Array(w * h);
    for (let i = 0; i < t.length; i++) {
      if (t[i] || outside[i] || seen[i]) continue;
      const comp = [i]; seen[i] = 1;
      for (let q = 0; q < comp.length; q++) {
        const k = comp[q], x = k % w;
        for (const j of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, k - w, k + w]) {
          if (j >= 0 && j < t.length && !t[j] && !outside[j] && !seen[j]) { seen[j] = 1; comp.push(j); }
        }
      }
      if (comp.length <= limit) for (const k of comp) t[k] = 1;
    }
  }

  function isEdge(src2, target, w, h, i) {
    const x = i % w, y = (i / w) | 0;
    if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return false;
    for (const j of [i - 1, i + 1, i - w, i + w]) if (target[j] && src2[j] === 0) return true;
    return false;
  }

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* =================================================================
     Sample artifacts (drawn procedurally so the demo works offline)
     ================================================================= */
  const VESSELS = {
    amphora: {
      label: 'Roman amphora', body: '#b5623a', dark: '#7c3a1f', band: '#2a1d16', light: '#e8b48a',
      profile: (t) => t < 0.08 ? 0.17 : t < 0.12 ? 0.2 : t < 0.3 ? 0.14 + (t - 0.12) * 0.3 : t < 0.7 ? 0.19 + Math.sin((t - 0.3) / 0.4 * Math.PI) * 0.18 : t < 0.93 ? 0.19 - (t - 0.7) * 0.6 : 0.06 + (t - 0.93) * 0.9,
      handles: true, bands: [0.38, 0.62], pattern: 'meander'
    },
    jar: {
      label: 'Egyptian storage jar', body: '#c9a06a', dark: '#8a6a3c', band: '#2f4f6f', light: '#f0dcae',
      profile: (t) => t < 0.06 ? 0.2 : t < 0.14 ? 0.16 : t < 0.55 ? 0.16 + Math.sin((t - 0.14) / 0.82 * Math.PI) * 0.22 : 0.16 + Math.sin((t - 0.14) / 0.82 * Math.PI) * 0.22 - (t - 0.55) * 0.18,
      handles: false, bands: [0.24, 0.3, 0.7], pattern: 'lotus'
    },
    cylinder: {
      label: 'Maya cylinder vase', body: '#d8a26a', dark: '#9a5e33', band: '#7a2a1c', light: '#f3d2a2',
      profile: (t) => t < 0.04 ? 0.25 : t > 0.96 ? 0.23 : 0.235 - Math.sin(t * Math.PI) * 0.012,
      handles: false, bands: [0.12, 0.88], pattern: 'glyphs'
    }
  };

  function drawVessel(type, broken, variant = 0) {
    const V = VESSELS[type];
    const W = 360, H = 440, c = makeCanvas(W, H), ctx = c.getContext('2d');
    const bgc = variant ? '#eef0f2' : '#e6e9ec';
    ctx.fillStyle = bgc; ctx.fillRect(0, 0, W, H);
    const top = 50, bot = 400, cx = W / 2, hgt = bot - top;
    const half = (t) => V.profile(t) * W;
    // silhouette path
    const path = new Path2D();
    path.moveTo(cx - half(0), top);
    for (let i = 0; i <= 100; i++) { const t = i / 100; path.lineTo(cx - half(t), top + t * hgt); }
    for (let i = 100; i >= 0; i--) { const t = i / 100; path.lineTo(cx + half(t), top + t * hgt); }
    path.closePath();
    ctx.save();
    ctx.clip(path);
    const g = ctx.createLinearGradient(cx - W * 0.4, 0, cx + W * 0.4, 0);
    g.addColorStop(0, V.dark); g.addColorStop(0.35, V.light); g.addColorStop(0.55, V.body); g.addColorStop(1, V.dark);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const bandCol = variant ? shift(V.band, 18) : V.band;
    V.bands.forEach(b => { ctx.fillStyle = bandCol; ctx.fillRect(0, top + b * hgt - 4, W, 8); });
    ctx.strokeStyle = bandCol; ctx.fillStyle = bandCol; ctx.lineWidth = 4;
    if (V.pattern === 'meander') {
      const y = top + 0.44 * hgt;
      ctx.beginPath();
      for (let x = 20; x < W - 20; x += 24) { ctx.moveTo(x, y + 14); ctx.lineTo(x, y); ctx.lineTo(x + 16, y); ctx.lineTo(x + 16, y + 9); ctx.lineTo(x + 8, y + 9); }
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, top + 0.53 * hgt); for (let x = 0; x < W; x += 12) ctx.lineTo(x + 6, top + 0.53 * hgt + (x / 12 % 2 ? -6 : 6)); ctx.stroke();
    } else if (V.pattern === 'lotus') {
      for (let x = 10; x < W; x += 26) {
        const y = top + 0.36 * hgt;
        ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.quadraticCurveTo(x - 9, y + 10, x, y); ctx.quadraticCurveTo(x + 9, y + 10, x, y + 30); ctx.fill();
      }
      ctx.beginPath(); for (let x = 0; x < W; x += 14) { ctx.moveTo(x, top + 0.62 * hgt); ctx.arc(x + 7, top + 0.62 * hgt, 7, Math.PI, 0); } ctx.stroke();
    } else {
      for (let k = 0; k < 7; k++) {
        const x = 40 + k * 44, y = top + 0.3 * hgt;
        ctx.strokeRect(x, y, 30, 34); ctx.beginPath(); ctx.arc(x + 15, y + 17, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillRect(x + 6, y + 48, 18, 70);
        ctx.beginPath(); ctx.arc(x + 15, y + 46, 9, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    if (V.handles) {
      ctx.strokeStyle = V.dark; ctx.lineWidth = 11; ctx.lineCap = 'round';
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(cx + s * half(0.14), top + 0.14 * hgt); ctx.bezierCurveTo(cx + s * W * 0.26, top + 0.1 * hgt, cx + s * W * 0.3, top + 0.22 * hgt, cx + s * half(0.3) + s * 4, top + 0.32 * hgt); ctx.stroke(); });
    }
    if (broken) {
      ctx.fillStyle = bgc;
      ctx.beginPath();
      const pts = type === 'cylinder'
        ? [[cx + 10, top - 5], [cx + 40, top + 40], [cx + 18, top + 95], [cx + 62, top + 150], [cx + 34, top + 210], [cx + 72, top + 260], [cx + 200, top + 270], [cx + 200, top - 5]]
        : [[cx + 22, top + 0.22 * hgt], [cx + 46, top + 0.34 * hgt], [cx + 26, top + 0.46 * hgt], [cx + 58, top + 0.58 * hgt], [cx + 40, top + 0.7 * hgt], [cx + 200, top + 0.76 * hgt], [cx + 200, top + 0.18 * hgt]];
      pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath(); ctx.fill();
      // chip in the rim and a crack
      ctx.beginPath(); ctx.moveTo(cx - half(0) - 5, top - 4); ctx.lineTo(cx - half(0) + 26, top - 4); ctx.lineTo(cx - half(0) + 12, top + 16); ctx.lineTo(cx - half(0) - 5, top + 12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(40,24,14,.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 40, top + 0.6 * hgt); ctx.lineTo(cx - 28, top + 0.66 * hgt); ctx.lineTo(cx - 44, top + 0.73 * hgt); ctx.lineTo(cx - 30, top + 0.8 * hgt); ctx.stroke();
    }
    return c.toDataURL('image/png');
  }

  function shift(hexc, d) {
    const n = parseInt(hexc.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, v + d));
    return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`;
  }

  function samples() {
    return Object.keys(VESSELS).map(k => ({ id: k, label: VESSELS[k].label, broken: drawVessel(k, true), refs: [drawVessel(k, false, 1)] }));
  }

  return { run, samples, drawVessel };
})();
