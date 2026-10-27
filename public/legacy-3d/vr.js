/* =====================================================================
   VR & Walk-in modes
   ---------------------------------------------------------------------
   Three ways to stand inside a reconstruction at real-world scale:
     • xr     – VR headsets (Meta Quest, Pico, …) through WebXR
     • stereo – phone VR viewers (Google Cardboard style): split screen,
                head tracking with the phone's motion sensors
     • mono   – walk-in view on a computer or phone without a headset
   The visitor is placed at eye level at each landmark and can jump
   between landmarks. A floating panel shows the landmark information.

   Coordinate spaces
     world  – scene units (see scenes.js)
     local  – metres, origin on the floor where the visitor stands,
              −Z points toward the current landmark
   ===================================================================== */
(function (global) {
  'use strict';
  const { M4 } = Engine3D;
  const EYE = 1.6;          // eye height in metres
  const IPD = 0.064;        // distance between the eyes in metres

  /* ---------- Quaternion helpers (x, y, z, w) ---------- */
  const Q = {
    mul(a, b) {
      return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
    },
    axis(ax, ang) { const s = Math.sin(ang / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(ang / 2)]; },
    eulerYXZ(x, y, z) {
      const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2), s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
      return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 - s1 * s2 * c3, c1 * c2 * c3 + s1 * s2 * s3];
    },
    rotate(q, v) {
      const [x, y, z, w] = q;
      const ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
      return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
    }
  };

  /* ---------- Matrix helpers (column-major) ---------- */
  const T = (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
  const S = (k) => new Float32Array([k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1]);
  const RY = (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };
  const mul = (...ms) => ms.reduce((a, b) => M4.multiply(a, b));
  function viewFrom(q, p) {
    // camera rotation q (camera looks down −Z), position p → view matrix
    const r = Q.rotate(q, [1, 0, 0]), u = Q.rotate(q, [0, 1, 0]), f = Q.rotate(q, [0, 0, 1]);
    const d = (a) => a[0] * p[0] + a[1] * p[1] + a[2] * p[2];
    return new Float32Array([r[0], u[0], f[0], 0, r[1], u[1], f[1], 0, r[2], u[2], f[2], 0, -d(r), -d(u), -d(f), 1]);
  }

  /* ---------- Landmark standing points ---------- */
  function computeStops(def) {
    return def.pois.map(p => {
      let x, z;
      if (p.vr && p.vr.stand) [x, z] = p.vr.stand;
      else {
        const d = p.view.radius * 0.55;
        x = p.view.target[0] + d * Math.sin(p.view.theta);
        z = p.view.target[2] + d * Math.cos(p.view.theta);
      }
      const dx = p.view.target[0] - x, dz = p.view.target[2] - z;
      return { name: p.name, text: p.text, x, z, y: p.vr && p.vr.y != null ? p.vr.y : null, yaw: Math.atan2(-dx, -dz) };
    });
  }

  /* ---------- Information panel (text drawn on a canvas → texture) ---------- */
  const PVS = 'attribute vec3 aPos; attribute vec2 aUV; uniform mat4 uVP; varying vec2 vUV; void main(){ vUV=aUV; gl_Position=uVP*vec4(aPos,1.0); }';
  const PFS = 'precision mediump float; uniform sampler2D uTex; varying vec2 vUV; void main(){ gl_FragColor=texture2D(uTex,vUV); }';

  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  class Panel {
    constructor(gl) {
      this.gl = gl;
      const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
      this.prog = gl.createProgram();
      gl.attachShader(this.prog, sh(gl.VERTEX_SHADER, PVS));
      gl.attachShader(this.prog, sh(gl.FRAGMENT_SHADER, PFS));
      gl.linkProgram(this.prog);
      this.aPos = gl.getAttribLocation(this.prog, 'aPos');
      this.aUV = gl.getAttribLocation(this.prog, 'aUV');
      this.uVP = gl.getUniformLocation(this.prog, 'uVP');
      this.canvas = document.createElement('canvas');
      this.canvas.width = 1024; this.canvas.height = 512;
      this.tex = gl.createTexture();
      this.buf = gl.createBuffer();
      this.uvb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
    }
    place(cx, cy, cz, w, h) {
      const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, cz, x1, y0, cz, x1, y1, cz, x0, y0, cz, x1, y1, cz, x0, y1, cz]), gl.STATIC_DRAW);
    }
    update(title, body, step, hint, accent) {
      const c = this.canvas, g = c.getContext('2d');
      g.clearRect(0, 0, c.width, c.height);
      g.fillStyle = 'rgba(29,26,22,0.88)';
      g.beginPath(); g.roundRect ? g.roundRect(8, 8, 1008, 496, 36) : g.rect(8, 8, 1008, 496); g.fill();
      g.fillStyle = accent || '#d9a92e';
      g.fillRect(30, 44, 8, 112);
      g.fillStyle = '#d9a92e'; g.font = '600 26px Inter, Arial, sans-serif';
      g.fillText(step.toUpperCase(), 60, 70);
      g.fillStyle = '#ffffff'; g.font = '700 60px "Cormorant Garamond", Georgia, serif';
      g.fillText(title, 60, 140);
      g.fillStyle = '#e8dcc2'; g.font = '400 31px Inter, Arial, sans-serif';
      wrap(g, body, 920).slice(0, 6).forEach((l, i) => g.fillText(l, 60, 205 + i * 44));
      g.fillStyle = '#b9ab90'; g.font = '500 25px Inter, Arial, sans-serif';
      g.fillText(hint, 60, 476);
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    draw(vp) {
      const gl = this.gl;
      gl.useProgram(this.prog);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.disable(gl.DEPTH_TEST);
      gl.uniformMatrix4fv(this.uVP, false, vp);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvb);
      gl.enableVertexAttribArray(this.aUV);
      gl.vertexAttribPointer(this.aUV, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(this.aUV);
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
    }
    dispose() { const gl = this.gl; gl.deleteTexture(this.tex); gl.deleteBuffer(this.buf); gl.deleteBuffer(this.uvb); gl.deleteProgram(this.prog); }
  }

  /* =================================================================
     Immersive session
     ================================================================= */
  class Immersive {
    constructor(viewer, def, opts) {
      this.viewer = viewer; this.def = def; this.gl = viewer.gl;
      this.mode = opts.mode;               // 'xr' | 'stereo' | 'mono'
      this.onExit = opts.onExit || (() => { });
      this.onStop = opts.onStop || (() => { });
      this.accent = opts.accent;
      this.scale = def.vrScale || 2;       // metres per scene unit
      this.stops = computeStops(def);
      this.index = 0;
      this.yaw = 0; this.pitch = 0;        // look direction for mono / touch
      this.gyro = null; this.gyroOffset = 0; this.needRecenter = true;
      this.keys = new Set();
      this.floorY = 0;
      this.panelOn = true;
      this.panel = new Panel(this.gl);
    }

    /* ---- landmark navigation ---- */
    go(i) {
      const n = this.stops.length;
      this.index = ((i % n) + n) % n;
      const st = this.stops[this.index];
      this.stand = { x: st.x, z: st.z, yaw: st.yaw, fixedY: st.y };
      this.yaw = 0; this.pitch = -0.05; this.needRecenter = true;
      this.refreshPanel();
      this.onStop(this.index);
    }
    hint() {
      if (this.mode === 'xr') return 'Trigger: next landmark  ·  Left trigger: back  ·  Grip: hide panel  ·  Sticks: walk / turn';
      if (this.mode === 'stereo') return 'Tap the screen to go to the next landmark';
      return 'Drag to look  ·  W A S D to walk  ·  ← → landmarks  ·  I hides this panel';
    }
    refreshPanel() {
      const st = this.stops[this.index];
      this.panel.update(st.name, st.text, `${this.def.title.split(' — ')[0]} · Landmark ${this.index + 1} of ${this.stops.length}`, this.hint(), this.accent);
    }
    groundY() {
      if (this.stand.fixedY != null) return this.stand.fixedY;
      return this.def.heightAt ? Math.max(this.def.heightAt(this.stand.x, this.stand.z), -0.5) : 0;
    }
    /* world (scene units) → local (metres) */
    worldToLocal() {
      return mul(T(0, this.floorY, 0), RY(-this.stand.yaw), S(this.scale), T(-this.stand.x, -this.groundY(), -this.stand.z));
    }
    localToWorld(p) {
      const x = p[0] / this.scale, y = (p[1] - this.floorY) / this.scale, z = p[2] / this.scale;
      const a = this.stand.yaw, c = Math.cos(a), s = Math.sin(a);
      return [this.stand.x + c * x + s * z, this.groundY() + y, this.stand.z - s * x + c * z];
    }
    moveLocal(dx, dz) {
      // dx, dz in metres in local space
      const a = this.stand.yaw, c = Math.cos(a), s = Math.sin(a);
      const wx = (c * dx + s * dz) / this.scale, wz = (-s * dx + c * dz) / this.scale;
      this.stand.x = Math.max(-200, Math.min(200, this.stand.x + wx));
      this.stand.z = Math.max(-200, Math.min(200, this.stand.z + wz));
      this.stand.fixedY = null;
    }

    /* ---- shared drawing of one eye ---- */
    drawEye(proj, view, rect, eyeLocal) {
      const M = this.worldToLocal();
      const vpWorld = mul(proj, view, M);
      this.viewer.drawScene(vpWorld, this.localToWorld(eyeLocal), rect, true);
      if (this.panelOn) this.panel.draw(mul(proj, view));
    }

    /* =========================== Non-XR modes =========================== */
    async startScreen() {
      const v = this.viewer, host = v.container;
      v.immersive = this;
      v.orbit.disabled = true;
      host.classList.add('immersive', 'immersive-' + this.mode);
      this.overlay = document.createElement('div');
      this.overlay.className = 'vr-overlay';
      this.overlay.innerHTML = `
        <button class="vr-exit" aria-label="Exit">✕ Exit</button>
        ${this.mode === 'stereo' ? '<div class="vr-divider"></div><div class="vr-toast" id="vr-toast">Turn your phone sideways and place it in your VR viewer</div>'
          : '<div class="vr-controls"><button data-v="prev" aria-label="Previous landmark">‹ Previous</button><button data-v="panel">Info panel</button><button data-v="next" aria-label="Next landmark">Next ›</button></div>'}`;
      host.appendChild(this.overlay);
      this.overlay.querySelector('.vr-exit').addEventListener('click', (e) => { e.stopPropagation(); this.exit(); });
      this.overlay.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (b.dataset.v === 'next') this.go(this.index + 1);
        if (b.dataset.v === 'prev') this.go(this.index - 1);
        if (b.dataset.v === 'panel') this.panelOn = !this.panelOn;
      }));
      // Start the session first: entering fullscreen can take a moment (or be
      // blocked), and the viewer must not stay in a half-open state.
      this._done = false;
      this.active = true;
      this.go(0);
      this.frame = (now, dt) => this.screenFrame(dt);
      try { if (host.requestFullscreen) await host.requestFullscreen(); } catch (e) { /* CSS full-screen fallback */ }
      if (this.mode === 'stereo') { try { await screen.orientation.lock('landscape'); } catch (e) { } }
      this.fsHandler = () => { if (!document.fullscreenElement && this.active && this.wasFullscreen) this.exit(); this.wasFullscreen = !!document.fullscreenElement; };
      document.addEventListener('fullscreenchange', this.fsHandler);
      this.wasFullscreen = !!document.fullscreenElement;

      // pointer: drag to look, tap to advance (stereo)
      let start = null, last = null;
      this.pd = (e) => { start = last = [e.clientX, e.clientY]; host.setPointerCapture && host.setPointerCapture(e.pointerId); };
      this.pm = (e) => {
        if (!last) return;
        if (!this.gyro) { this.yaw += (e.clientX - last[0]) * 0.004; this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch + (e.clientY - last[1]) * 0.004)); }
        last = [e.clientX, e.clientY];
      };
      this.pu = (e) => {
        if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) < 8 && this.mode === 'stereo' && !e.target.closest('button')) this.go(this.index + 1);
        start = last = null;
      };
      host.addEventListener('pointerdown', this.pd);
      host.addEventListener('pointermove', this.pm);
      host.addEventListener('pointerup', this.pu);
      this.kd = (e) => {
        const k = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown'].includes(k)) { this.keys.add(k); e.preventDefault(); }
        if (k === 'arrowright') this.go(this.index + 1);
        if (k === 'arrowleft') this.go(this.index - 1);
        if (k === 'i') this.panelOn = !this.panelOn;
        if (k === 'escape') this.exit();
      };
      this.ku = (e) => this.keys.delete(e.key.toLowerCase());
      window.addEventListener('keydown', this.kd);
      window.addEventListener('keyup', this.ku);

      // phone motion sensors
      if (this.mode === 'stereo') {
        this.ori = (e) => { if (e.alpha == null) return; this.gyro = { a: e.alpha, b: e.beta, g: e.gamma }; };
        window.addEventListener('deviceorientation', this.ori);
        setTimeout(() => { const t = document.getElementById('vr-toast'); if (t) t.textContent = this.gyro ? 'Move your head to look around · Tap to go to the next landmark' : 'Motion sensors unavailable — drag to look around · Tap for the next landmark'; }, 1600);
        setTimeout(() => { const t = document.getElementById('vr-toast'); if (t) t.classList.add('hide'); }, 6000);
      }
    }

    deviceQuat() {
      const d = Math.PI / 180, g = this.gyro;
      const orient = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * d;
      let q = Q.eulerYXZ(g.b * d, g.a * d, -g.g * d);
      q = Q.mul(q, [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]);
      q = Q.mul(q, Q.axis([0, 0, 1], -orient));
      return q;
    }
    screenFrame(dt) {
      const v = this.viewer, gl = this.gl;
      // keyboard walking (metres per second)
      const sp = 4 * Math.min(dt, 100) / 1000;
      let f = 0, r = 0;
      if (this.keys.has('w') || this.keys.has('arrowup')) f += 1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) f -= 1;
      if (this.keys.has('d')) r += 1;
      if (this.keys.has('a')) r -= 1;
      if (f || r) {
        const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
        this.moveLocal((fx * f + -fz * r) * sp, (fz * f + fx * r) * sp);
      }
      // camera orientation
      let q;
      if (this.gyro) {
        const dq = this.deviceQuat();
        if (this.needRecenter) {
          const fw = Q.rotate(dq, [0, 0, -1]);
          this.gyroOffset = -Math.atan2(-fw[0], -fw[2]);
          this.needRecenter = false;
        }
        q = Q.mul(Q.axis([0, 1, 0], this.gyroOffset), dq);
      } else {
        q = Q.mul(Q.axis([0, 1, 0], this.yaw), Q.axis([1, 0, 0], this.pitch));
      }
      const W = v.canvas.width, H = v.canvas.height;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (this.mode === 'stereo') {
        const proj = M4.perspective(1.45, (W / 2) / H, 0.1, 6000);
        const right = Q.rotate(q, [1, 0, 0]);
        [-1, 1].forEach((side, i) => {
          const eye = [right[0] * side * IPD / 2, EYE + right[1] * side * IPD / 2, right[2] * side * IPD / 2];
          this.drawEye(proj, viewFrom(q, eye), [i * Math.floor(W / 2), 0, Math.floor(W / 2), H], eye);
        });
      } else {
        const proj = M4.perspective(1.05, W / H, 0.1, 6000);
        const eye = [0, EYE, 0];
        this.drawEye(proj, viewFrom(q, eye), [0, 0, W, H], eye);
      }
    }

    /* ============================ WebXR mode ============================ */
    async startXR() {
      const gl = this.gl, v = this.viewer;
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
      this.session = session;
      await gl.makeXRCompatible();
      const layer = new XRWebGLLayer(session, gl);
      session.updateRenderState({ baseLayer: layer, depthNear: 0.1, depthFar: 10000 });
      try { this.ref = await session.requestReferenceSpace('local-floor'); this.floorY = 0; }
      catch (e) { this.ref = await session.requestReferenceSpace('local'); this.floorY = -EYE; }
      v.immersive = this; this.frame = null; this.active = true; this._done = false;
      this.panel.place(0, this.floorY + 1.05, -2.3, 1.6, 0.8);
      this.go(0);
      session.addEventListener('select', (e) => this.go(this.index + (e.inputSource.handedness === 'left' ? -1 : 1)));
      session.addEventListener('squeeze', () => { this.panelOn = !this.panelOn; });
      session.addEventListener('end', () => this.finish());
      this.turnLatch = false;
      let last = performance.now();
      const onFrame = (t, frame) => {
        if (!this.active) return;
        session.requestAnimationFrame(onFrame);
        const dt = Math.min(100, t - last); last = t;
        const pose = frame.getViewerPose(this.ref);
        if (!pose) return;
        this.xrInput(pose, dt);
        gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
        for (const view of pose.views) {
          const vpRect = layer.getViewport(view);
          const p = view.transform.position;
          this.drawEye(view.projectionMatrix, view.transform.inverse.matrix, [vpRect.x, vpRect.y, vpRect.width, vpRect.height], [p.x, p.y, p.z]);
        }
      };
      session.requestAnimationFrame(onFrame);
    }
    xrInput(pose, dt) {
      for (const src of this.session.inputSources) {
        const gp = src.gamepad;
        if (!gp || gp.axes.length < 2) continue;
        const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0], ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1];
        if (src.handedness === 'right') {
          // snap turn 30°
          if (Math.abs(ax) > 0.7 && !this.turnLatch) { this.stand.yaw -= Math.sign(ax) * Math.PI / 6; this.turnLatch = true; }
          if (Math.abs(ax) < 0.3) this.turnLatch = false;
        } else if (Math.abs(ax) > 0.15 || Math.abs(ay) > 0.15) {
          const o = pose.transform.orientation;
          const fw = Q.rotate([o.x, o.y, o.z, o.w], [0, 0, -1]);
          const l = Math.hypot(fw[0], fw[2]) || 1, fx = fw[0] / l, fz = fw[2] / l;
          const sp = 3 * dt / 1000;
          this.moveLocal((fx * -ay + -fz * ax) * sp, (fz * -ay + fx * ax) * sp);
        }
      }
    }

    /* ============================== Exit ============================== */
    exit() {
      if (this.session) { this.session.end().catch(() => this.finish()); return; }
      this.finish();
    }
    finish() {
      if (this._done) return;
      this._done = true;
      const wasActive = this.active;
      this.active = false;
      const v = this.viewer, host = v.container;
      if (this.overlay) this.overlay.remove();
      host.classList.remove('immersive', 'immersive-' + this.mode);
      if (this.pd) { host.removeEventListener('pointerdown', this.pd); host.removeEventListener('pointermove', this.pm); host.removeEventListener('pointerup', this.pu); }
      if (this.kd) { window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku); }
      if (this.ori) window.removeEventListener('deviceorientation', this.ori);
      if (this.fsHandler) document.removeEventListener('fullscreenchange', this.fsHandler);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      try { screen.orientation.unlock(); } catch (e) { }
      this.panel.dispose();
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      v.immersive = null; v.orbit.disabled = false; v.dirty = true;
      if (wasActive) this.onExit(this.index);
    }
  }

  /* ---------- Public API ---------- */
  const VR = {
    async xrSupported() {
      try { return !!(navigator.xr && await navigator.xr.isSessionSupported('immersive-vr')); } catch (e) { return false; }
    },
    async requestMotionPermission() {
      // iPhone / iPad ask for permission before sharing motion sensors
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try { return (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch (e) { return false; }
      }
      return true;
    },
    async start(viewer, def, opts) {
      const im = new Immersive(viewer, def, opts);
      if (opts.mode === 'xr') await im.startXR();
      else {
        im.panel.place(0, 1.02, -2.2, 1.5, 0.75);
        await im.startScreen();
      }
      return im;
    }
  };
  global.VRMode = VR;
})(window);
