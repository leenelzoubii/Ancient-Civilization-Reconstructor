/* =====================================================================
   Ancient Civilization Reconstructor — 3D Engine
   A lightweight WebGL renderer built for this project so the website
   runs fully offline with no external libraries.
   Concepts mirror common 3D frameworks: geometry builder (mesh),
   camera, lights, fog, camera orbit controls and a render loop.
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---------- Small math helpers ---------- */
  const V = {
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
  };

  const M4 = {
    perspective(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    },
    lookAt(eye, center, up) {
      const z = V.norm(V.sub(eye, center));
      const x = V.norm(V.cross(up, z));
      const y = V.cross(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
        -V.dot(x, eye), -V.dot(y, eye), -V.dot(z, eye), 1]);
    },
    multiply(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
      return o;
    }
  };

  /* ---------- Colour helpers ---------- */
  function hex(c) {
    if (Array.isArray(c)) return c;
    const n = parseInt(c.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function shade(c, f) { c = hex(c); return [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)]; }
  function mix(a, b, t) { a = hex(a); b = hex(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  /* Deterministic random numbers so scenes look identical every visit */
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Geometry builder ----------
     All primitives are written into one big vertex buffer (flat shaded).
     Convention: y is up and every primitive's `y` is its BASE height. */
  class MeshBuilder {
    constructor() { this.pos = []; this.nor = []; this.col = []; }

    tri(a, b, c, color) {
      const n = V.norm(V.cross(V.sub(b, a), V.sub(c, a)));
      const k = hex(color);
      this.pos.push(...a, ...b, ...c);
      this.nor.push(...n, ...n, ...n);
      this.col.push(...k, ...k, ...k);
    }
    quad(a, b, c, d, color) { this.tri(a, b, c, color); this.tri(a, c, d, color); }

    static xf(p, o) {
      const ry = o.ry || 0, c = Math.cos(ry), s = Math.sin(ry);
      return [p[0] * c + p[2] * s + (o.x || 0), p[1] + (o.y || 0), -p[0] * s + p[2] * c + (o.z || 0)];
    }

    /* Axis-aligned box (optionally rotated about Y) */
    box(o) {
      const w = o.w / 2, d = o.d / 2, h = o.h, col = o.color;
      const P = (x, y, z) => MeshBuilder.xf([x, y, z], o);
      const p = [P(-w, 0, -d), P(w, 0, -d), P(w, 0, d), P(-w, 0, d), P(-w, h, -d), P(w, h, -d), P(w, h, d), P(-w, h, d)];
      const top = o.top || col, side = col;
      this.quad(p[4], p[7], p[6], p[5], top);
      if (o.bottom !== false) this.quad(p[0], p[1], p[2], p[3], shade(col, 0.6));
      this.quad(p[3], p[2], p[6], p[7], side);
      this.quad(p[1], p[0], p[4], p[5], side);
      this.quad(p[2], p[1], p[5], p[6], side);
      this.quad(p[0], p[3], p[7], p[4], side);
    }

    /* Frustum / cylinder / cone / pyramid / elliptical ring */
    frustum(o) {
      const n = o.sides || 16, rb = o.rb, rt = o.rt === undefined ? o.rb : o.rt, h = o.h;
      const sx = o.sx || 1, sz = o.sz || 1, a0 = o.a0 || 0;
      const P = (x, y, z) => MeshBuilder.xf([x, y, z], o);
      const ring = (r, y) => {
        const pts = [];
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / n) * Math.PI * 2;
          pts.push(P(Math.cos(a) * r * sx, y, Math.sin(a) * r * sz));
        }
        return pts;
      };
      const B = ring(rb, 0), T = ring(rt, h);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const c = o.stripe && i % 2 ? shade(o.color, o.stripe) : o.color;
        if (rt === 0) this.tri(B[i], B[j], T[i], c);
        else this.quad(B[i], B[j], T[j], T[i], c);
      }
      if (o.caps !== false) {
        const cb = P(0, 0, 0), ct = P(0, h, 0);
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          if (o.bottomCap) this.tri(cb, B[j], B[i], shade(o.color, 0.6));
          if (rt > 0) this.tri(ct, T[i], T[j], o.capColor || o.color);
        }
      }
    }

    /* Low-poly sphere / ellipsoid (centre at y + r*sy) */
    sphere(o) {
      const r = o.r, sy = o.sy || 1, lat = o.lat || 6, lon = o.lon || 9;
      const cy = o.r * sy;
      const P = (t, p) => MeshBuilder.xf([r * Math.sin(t) * Math.cos(p), cy + r * sy * Math.cos(t), r * Math.sin(t) * Math.sin(p)], o);
      for (let i = 0; i < lat; i++) {
        const t0 = (i / lat) * Math.PI, t1 = ((i + 1) / lat) * Math.PI;
        for (let j = 0; j < lon; j++) {
          const p0 = (j / lon) * Math.PI * 2, p1 = ((j + 1) / lon) * Math.PI * 2;
          const c = o.vary ? shade(o.color, 0.9 + ((i * 7 + j * 3) % 5) * 0.05) : o.color;
          this.quad(P(t0, p0), P(t0, p1), P(t1, p1), P(t1, p0), c);
        }
      }
    }

    /* Flat ellipse disk */
    disk(o) {
      const n = o.seg || 48, c = MeshBuilder.xf([0, 0, 0], o);
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        this.tri(c, MeshBuilder.xf([Math.cos(a1) * o.rx, 0, Math.sin(a1) * o.rz], o),
          MeshBuilder.xf([Math.cos(a0) * o.rx, 0, Math.sin(a0) * o.rz], o), o.color);
      }
    }

    /* Arch / ring segment in local XY plane, depth along local Z */
    arch(o) {
      const n = o.seg || 10, r = o.r, R = o.r + o.thick, d = o.depth / 2;
      const s0 = o.start || 0, s1 = o.end === undefined ? Math.PI : o.end;
      const P = (x, y, z) => MeshBuilder.xf([x, y, z], o);
      for (let i = 0; i < n; i++) {
        const a = s0 + (i / n) * (s1 - s0), b = s0 + ((i + 1) / n) * (s1 - s0);
        const ia = [Math.cos(a) * r, Math.sin(a) * r], ib = [Math.cos(b) * r, Math.sin(b) * r];
        const oa = [Math.cos(a) * R, Math.sin(a) * R], ob = [Math.cos(b) * R, Math.sin(b) * R];
        this.quad(P(ia[0], ia[1], d), P(oa[0], oa[1], d), P(ob[0], ob[1], d), P(ib[0], ib[1], d), o.color);
        this.quad(P(ia[0], ia[1], -d), P(ib[0], ib[1], -d), P(ob[0], ob[1], -d), P(oa[0], oa[1], -d), o.color);
        this.quad(P(ia[0], ia[1], -d), P(ia[0], ia[1], d), P(ib[0], ib[1], d), P(ib[0], ib[1], -d), shade(o.color, 0.8));
        this.quad(P(oa[0], oa[1], -d), P(ob[0], ob[1], -d), P(ob[0], ob[1], d), P(oa[0], oa[1], d), o.color);
      }
    }

    /* Triangular prism (gable roof / pediment) — triangle in XY, length along Z */
    gable(o) {
      const w = o.w / 2, h = o.h, l = o.len / 2;
      const P = (x, y, z) => MeshBuilder.xf([x, y, z], o);
      const f = [P(-w, 0, l), P(w, 0, l), P(0, h, l)], b = [P(-w, 0, -l), P(w, 0, -l), P(0, h, -l)];
      const face = o.face || o.color;
      this.tri(f[0], f[1], f[2], face);
      this.tri(b[1], b[0], b[2], face);
      this.quad(f[1], b[1], b[2], f[2], o.color);
      this.quad(b[0], f[0], f[2], b[2], o.color);
    }

    /* Height-field terrain */
    terrain(o) {
      const n = o.seg, s = o.size, step = s / n, H = o.height, C = o.color;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        pts.push([]);
        for (let j = 0; j <= n; j++) {
          const x = -s / 2 + j * step, z = -s / 2 + i * step;
          pts[i].push([x, H(x, z), z]);
        }
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const a = pts[i][j], b = pts[i][j + 1], c = pts[i + 1][j + 1], d = pts[i + 1][j];
        const cx = (a[0] + c[0]) / 2, cz = (a[2] + c[2]) / 2, cy = (a[1] + b[1] + c[1] + d[1]) / 4;
        const col = C(cx, cz, cy);
        this.tri(a, d, c, col);
        this.tri(a, c, b, shade(col, 0.97));
      }
    }

    build() {
      return { pos: new Float32Array(this.pos), nor: new Float32Array(this.nor), col: new Float32Array(this.col), count: this.pos.length / 3 };
    }
  }

  /* ---------- Sky dome (used in VR, where there is no page background) ---------- */
  function buildSky(def) {
    const cols = (def.sky.match(/#[0-9a-f]{6}/gi) || ['#9cc3dd', '#d9e4e0', '#f2dcb1']).map(hex);
    const top = cols[0], mid = cols[1] || cols[0], hor = cols[cols.length - 1], fog = hex(def.fog.color);
    const colAt = (e) => {
      if (e <= 0) return fog;
      const t = Math.min(1, e / (Math.PI / 2));
      if (t < 0.12) return mix(hor, mid, t / 0.12);
      return mix(mid, top, Math.min(1, (t - 0.12) / 0.6));
    };
    const R = 800, lat = 18, lon = 36, pos = [], nor = [], col = [];
    const P = (e, a) => [R * Math.cos(e) * Math.cos(a), R * Math.sin(e), R * Math.cos(e) * Math.sin(a)];
    for (let i = 0; i < lat; i++) {
      const e0 = -Math.PI / 2 + (i / lat) * Math.PI, e1 = -Math.PI / 2 + ((i + 1) / lat) * Math.PI;
      for (let j = 0; j < lon; j++) {
        const a0 = (j / lon) * Math.PI * 2, a1 = ((j + 1) / lon) * Math.PI * 2;
        const v = [[e0, a0], [e0, a1], [e1, a1], [e0, a0], [e1, a1], [e1, a0]];
        v.forEach(([e, a]) => { pos.push(...P(e, a)); nor.push(0, 1, 0); col.push(...colAt(e)); });
      }
    }
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), col: new Float32Array(col), count: pos.length / 3 };
  }

  /* ---------- Shaders ---------- */
  const VS = `
    attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCol;
    uniform mat4 uVP;
    varying vec3 vPos; varying vec3 vNor; varying vec3 vCol;
    void main(){ vPos=aPos; vNor=aNor; vCol=aCol; gl_Position=uVP*vec4(aPos,1.0); }`;
  const FS = `
    precision mediump float;
    varying vec3 vPos; varying vec3 vNor; varying vec3 vCol;
    uniform vec3 uCam; uniform vec3 uSun; uniform vec3 uSunCol;
    uniform vec3 uSky; uniform vec3 uGround; uniform vec3 uFog; uniform float uFogD; uniform float uUnlit;
    void main(){
      if(uUnlit>0.5){ gl_FragColor=vec4(vCol,1.0); return; }
      vec3 n=normalize(vNor);
      vec3 v=normalize(uCam-vPos);
      if(dot(n,v)<0.0) n=-n;                      // two-sided lighting
      float hemi=n.y*0.5+0.5;
      vec3 amb=mix(uGround,uSky,hemi);
      float dif=max(dot(n,normalize(uSun)),0.0);
      float ao=clamp(0.78+vPos.y*0.03,0.78,1.0);  // soft ground contact darkening
      vec3 col=vCol*(amb*0.62+uSunCol*dif*0.78)*ao;
      float d=length(uCam-vPos);
      float f=1.0-exp(-pow(d*uFogD,1.6));
      gl_FragColor=vec4(mix(col,uFog,clamp(f,0.0,1.0)),1.0);
    }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  /* ---------- Orbit camera controls ---------- */
  class Orbit {
    constructor(dom, opts, onChange) {
      this.dom = dom; this.onChange = onChange;
      this.target = opts.target.slice();
      this.theta = opts.theta; this.phi = opts.phi; this.radius = opts.radius;
      this.minR = opts.minRadius || 10; this.maxR = opts.maxRadius || 400;
      this.minPhi = 0.18; this.maxPhi = 1.45;
      this.autoRotate = false; this.tween = null;
      this.pointers = new Map();
      this._bind();
    }
    _bind() {
      const el = this.dom;
      el.style.touchAction = 'none';
      this._down = (e) => { if (this.disabled) return; el.setPointerCapture(e.pointerId); this.pointers.set(e.pointerId, [e.clientX, e.clientY]); this.tween = null; this.userActed && this.userActed(); };
      this._move = (e) => {
        if (this.disabled || !this.pointers.has(e.pointerId)) return;
        const prev = this.pointers.get(e.pointerId), cur = [e.clientX, e.clientY];
        if (this.pointers.size === 1) {
          if (e.shiftKey || e.buttons === 2) this._pan(cur[0] - prev[0], cur[1] - prev[1]);
          else { this.theta -= (cur[0] - prev[0]) * 0.006; this.phi -= (cur[1] - prev[1]) * 0.005; }
        } else if (this.pointers.size === 2) {
          const pts = [...this.pointers.values()];
          const other = pts[0] === prev ? pts[1] : pts[0];
          const d0 = Math.hypot(prev[0] - other[0], prev[1] - other[1]);
          const d1 = Math.hypot(cur[0] - other[0], cur[1] - other[1]);
          if (d0 > 0) this.radius *= d0 / d1;
        }
        this.pointers.set(e.pointerId, cur);
        this._clamp(); this.onChange();
      };
      this._up = (e) => { this.pointers.delete(e.pointerId); };
      this._wheel = (e) => { if (this.disabled) return; e.preventDefault(); this.tween = null; this.radius *= 1 + Math.sign(e.deltaY) * 0.08; this._clamp(); this.onChange(); };
      this._ctx = (e) => e.preventDefault();
      el.addEventListener('pointerdown', this._down);
      el.addEventListener('pointermove', this._move);
      el.addEventListener('pointerup', this._up);
      el.addEventListener('pointercancel', this._up);
      el.addEventListener('wheel', this._wheel, { passive: false });
      el.addEventListener('contextmenu', this._ctx);
    }
    _pan(dx, dy) {
      const k = this.radius * 0.0016;
      const c = Math.cos(this.theta), s = Math.sin(this.theta);
      this.target[0] -= (dx * c) * k; this.target[2] -= (-dx * s) * k;
      this.target[0] -= (dy * s) * k; this.target[2] -= (dy * c) * k;
    }
    _clamp() {
      this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));
      this.radius = Math.max(this.minR, Math.min(this.maxR, this.radius));
    }
    zoom(f) { this.tween = null; this.radius *= f; this._clamp(); this.onChange(); }
    position() {
      const r = this.radius, sp = Math.sin(this.phi);
      return [this.target[0] + r * sp * Math.sin(this.theta), this.target[1] + r * Math.cos(this.phi), this.target[2] + r * sp * Math.cos(this.theta)];
    }
    flyTo(view, ms = 1400) {
      let dt = view.theta - this.theta;
      while (dt > Math.PI) dt -= Math.PI * 2;
      while (dt < -Math.PI) dt += Math.PI * 2;
      this.tween = { t0: performance.now(), ms, from: { target: this.target.slice(), theta: this.theta, phi: this.phi, radius: this.radius },
        to: { target: view.target.slice(), theta: this.theta + dt, phi: view.phi, radius: view.radius } };
    }
    step(now, dt) {
      let moving = false;
      if (this.tween) {
        const tw = this.tween, t = Math.min(1, (now - tw.t0) / tw.ms), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.target = V.lerp(tw.from.target, tw.to.target, e);
        this.theta = tw.from.theta + (tw.to.theta - tw.from.theta) * e;
        this.phi = tw.from.phi + (tw.to.phi - tw.from.phi) * e;
        this.radius = tw.from.radius + (tw.to.radius - tw.from.radius) * e;
        if (t >= 1) this.tween = null;
        moving = true;
      } else if (this.autoRotate && this.pointers.size === 0) {
        this.theta += dt * 0.00012;
        moving = true;
      }
      return moving;
    }
    dispose() {
      const el = this.dom;
      el.removeEventListener('pointerdown', this._down);
      el.removeEventListener('pointermove', this._move);
      el.removeEventListener('pointerup', this._up);
      el.removeEventListener('pointercancel', this._up);
      el.removeEventListener('wheel', this._wheel);
      el.removeEventListener('contextmenu', this._ctx);
    }
  }

  /* ---------- Viewer: renderer + camera + scene ---------- */
  class Viewer {
    constructor(container, def) {
      this.container = container; this.def = def;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'viewer-canvas';
      this.canvas.setAttribute('aria-label', '3D reconstruction of ' + def.title + '. Drag to rotate, scroll to zoom.');
      this.canvas.setAttribute('role', 'img');
      container.appendChild(this.canvas);
      const gl = this.canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
      if (!gl) throw new Error('WebGL is not available in this browser.');
      this.gl = gl;

      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      this.prog = prog;
      this.loc = {};
      ['aPos', 'aNor', 'aCol'].forEach(a => this.loc[a] = gl.getAttribLocation(prog, a));
      ['uVP', 'uCam', 'uSun', 'uSunCol', 'uSky', 'uGround', 'uFog', 'uFogD', 'uUnlit'].forEach(u => this.loc[u] = gl.getUniformLocation(prog, u));

      const mb = new MeshBuilder();
      def.build(mb, { hex, shade, mix, rng });
      const mesh = mb.build();
      this.scene = this.makeBuffers(mesh);
      this.count = mesh.count;
      this.sky = this.makeBuffers(buildSky(def));
      this.orbit = new Orbit(this.canvas, def.camera, () => this.dirty = true);
      this.markers = [];
      this.dirty = true;
      this._last = performance.now();
      this._resize = this.resize.bind(this);
      this.ro = new ResizeObserver(this._resize);
      this.ro.observe(container);
      this.resize();
      this._loop = this.loop.bind(this);
      this.raf = requestAnimationFrame(this._loop);
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.container.clientWidth, h = this.container.clientHeight;
      this.canvas.width = Math.max(1, Math.floor(w * dpr));
      this.canvas.height = Math.max(1, Math.floor(h * dpr));
      this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
      this.w = w; this.h = h; this.dirty = true;
    }
    addMarker(el, pos) { this.markers.push({ el, pos }); this.dirty = true; }
    loop(now) {
      const dt = now - this._last; this._last = now;
      if (this.immersive) { if (this.immersive.frame) this.immersive.frame(now, dt); }
      else {
        if (this.orbit.step(now, dt)) this.dirty = true;
        if (this.dirty) { this.render(); this.dirty = false; }
      }
      this.raf = requestAnimationFrame(this._loop);
    }
    makeBuffers(mesh) {
      const gl = this.gl;
      const bufs = ['pos', 'nor', 'col'].map(k => {
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, mesh[k], gl.STATIC_DRAW);
        return b;
      });
      return { bufs, count: mesh.count };
    }
    render() {
      if (this.immersive) return;
      const eye = this.orbit.position();
      const proj = M4.perspective(0.85, this.w / Math.max(1, this.h), 0.5, 1500);
      const view = M4.lookAt(eye, this.orbit.target, [0, 1, 0]);
      const vp = M4.multiply(proj, view);
      this.vp = vp;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.drawScene(vp, eye, [0, 0, this.canvas.width, this.canvas.height], false);
      this.updateMarkers();
    }
    /* Draws the scene with any view-projection matrix into a viewport.
       Used by the orbit view and by the VR / walk-in modes (one call per eye). */
    drawScene(vp, eye, rect, withSky) {
      const gl = this.gl, d = this.def, L = this.loc;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(rect[0], rect[1], rect[2], rect[3]);
      gl.viewport(rect[0], rect[1], rect[2], rect[3]);
      const fc = hex(d.fog.color);
      if (withSky) gl.clearColor(fc[0], fc[1], fc[2], 1); else gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(this.prog);
      gl.uniformMatrix4fv(L.uVP, false, vp);
      gl.uniform3fv(L.uCam, eye);
      gl.uniform3fv(L.uSun, d.light.sun);
      gl.uniform3fv(L.uSunCol, hex(d.light.sunColor));
      gl.uniform3fv(L.uSky, hex(d.light.sky));
      gl.uniform3fv(L.uGround, hex(d.light.ground));
      gl.uniform3fv(L.uFog, fc);
      const bind = (m) => ['aPos', 'aNor', 'aCol'].forEach((a, i) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, m.bufs[i]);
        gl.enableVertexAttribArray(L[a]);
        gl.vertexAttribPointer(L[a], 3, gl.FLOAT, false, 0, 0);
      });
      if (withSky) {
        gl.uniform1f(L.uUnlit, 1); gl.uniform1f(L.uFogD, 0);
        gl.depthMask(false); bind(this.sky); gl.drawArrays(gl.TRIANGLES, 0, this.sky.count); gl.depthMask(true);
      }
      gl.uniform1f(L.uUnlit, 0); gl.uniform1f(L.uFogD, d.fog.density);
      bind(this.scene);
      gl.drawArrays(gl.TRIANGLES, 0, this.scene.count);
    }
    project(p) {
      const m = this.vp;
      const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
      const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
      const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      if (w <= 0) return null;
      return [(x / w + 1) / 2 * this.w, (1 - y / w) / 2 * this.h];
    }
    updateMarkers() {
      for (const mk of this.markers) {
        const s = this.project(mk.pos);
        if (!s || s[0] < -20 || s[1] < -20 || s[0] > this.w + 20 || s[1] > this.h + 20) { mk.el.style.display = 'none'; continue; }
        mk.el.style.display = '';
        mk.el.style.transform = `translate(${s[0]}px, ${s[1]}px)`;
      }
    }
    snapshot() { this.render(); return this.canvas.toDataURL('image/png'); }
    dispose() {
      cancelAnimationFrame(this.raf);
      this.ro.disconnect();
      this.orbit.dispose();
      const gl = this.gl;
      [this.scene, this.sky].forEach(m => m.bufs.forEach(b => gl.deleteBuffer(b)));
      gl.deleteProgram(this.prog);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      this.canvas.remove();
    }
  }

  global.Engine3D = { Viewer, MeshBuilder, M4, hex, shade, mix, rng };
})(window);
