/* physics.js — interactive physics demos
 * Each module computes the actual governing equation, not a cartoon.
 *   1. Coulomb field   : E = (1/4πε0) Σ q_i (r - r_i) / |r - r_i|^3
 *   2. Square well     : ψ_n = √(2/L) sin(nπx/L), Ψ(x,t) superposition
 *   3. Pendulum        : θ̈ + (g/L) sinθ = 0, RK4 integration (+ optional damping)
 *   4. Double slit     : I(θ) = I0 [sinβ/β]² cos²α (Fraunhofer)
 */

(function () {
  'use strict';

  // ---------- helpers ----------
  const fitCanvas = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(parseInt(canvas.getAttribute('height'), 10) * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: parseInt(canvas.getAttribute('height'), 10) };
  };

  const isDark = () =>
    !document.documentElement.dataset.theme ||
    document.documentElement.dataset.theme === 'dark';

  const fg = () => (isDark() ? '#e6edf3' : '#1a1f26');
  const grid = () => (isDark() ? 'rgba(230,237,243,0.07)' : 'rgba(26,31,38,0.07)');

  // ============================================================
  // 1. ELECTRIC FIELD
  // ============================================================
  function initEField() {
    const canvas = document.getElementById('phys-efield');
    if (!canvas) return;
    let ctx, W, H;
    // Normalized units: k = 1, charges have q = ±1 (or user-scaled).
    let charges = [];
    let showLines = true;
    let gridN = 22;
    let dragIdx = -1;
    let didDrag = false;

    const reset = () => {
      charges = [
        { x: 0.35, y: 0.5, q: +1 },
        { x: 0.65, y: 0.5, q: -1 },
      ];
    };
    reset();

    const fieldAt = (x, y) => {
      let Ex = 0, Ey = 0;
      for (const c of charges) {
        const dx = x - c.x, dy = y - c.y;
        const r2 = dx * dx + dy * dy + 1e-6;
        const r3 = Math.pow(r2, 1.5);
        Ex += c.q * dx / r3;
        Ey += c.q * dy / r3;
      }
      return [Ex, Ey];
    };

    const draw = () => {
      ({ ctx, w: W, h: H } = fitCanvas(canvas));
      ctx.clearRect(0, 0, W, H);

      // background grid
      ctx.strokeStyle = grid();
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * W, y = (i / 10) * H;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // field arrows on lattice — length log-scaled so near-charge clipping stays readable
      const step = Math.min(W, H) / gridN;
      for (let gx = step / 2; gx < W; gx += step) {
        for (let gy = step / 2; gy < H; gy += step) {
          const [Ex, Ey] = fieldAt(gx / W, gy / H);
          const mag = Math.hypot(Ex, Ey);
          if (mag < 1e-3) continue;
          const len = Math.min(step * 0.9, step * (Math.log1p(mag) / 4));
          const ux = Ex / mag, uy = Ey / mag;
          // color: log magnitude → hue (cool blue low, hot red high)
          const L = Math.min(1, Math.log1p(mag) / 6);
          const r = Math.round(80 + 175 * L);
          const g = Math.round(120 + 40 * (1 - L));
          const b = Math.round(220 * (1 - L) + 40);
          ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`;
          ctx.lineWidth = 1.2;
          const x2 = gx + ux * len, y2 = gy + uy * len;
          ctx.beginPath();
          ctx.moveTo(gx, gy); ctx.lineTo(x2, y2); ctx.stroke();
          // arrowhead
          const ah = 4;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - ux * ah - uy * ah * 0.6, y2 - uy * ah + ux * ah * 0.6);
          ctx.lineTo(x2 - ux * ah + uy * ah * 0.6, y2 - uy * ah - ux * ah * 0.6);
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }

      // field lines from positive charges
      if (showLines) {
        ctx.strokeStyle = isDark() ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)';
        ctx.lineWidth = 1.1;
        const nLines = 14;
        for (const c of charges) {
          if (c.q <= 0) continue;
          for (let k = 0; k < nLines; k++) {
            const a = (k / nLines) * 2 * Math.PI;
            let x = c.x + 0.012 * Math.cos(a);
            let y = c.y + 0.012 * Math.sin(a);
            ctx.beginPath();
            ctx.moveTo(x * W, y * H);
            for (let s = 0; s < 600; s++) {
              const [Ex, Ey] = fieldAt(x, y);
              const m = Math.hypot(Ex, Ey);
              if (m < 1e-4) break;
              x += (Ex / m) * 0.003;
              y += (Ey / m) * 0.003;
              if (x < 0 || x > 1 || y < 0 || y > 1) break;
              // terminate on negative charge
              let hit = false;
              for (const d of charges) {
                if (d.q < 0 && Math.hypot(x - d.x, y - d.y) < 0.018) { hit = true; break; }
              }
              ctx.lineTo(x * W, y * H);
              if (hit) break;
            }
            ctx.stroke();
          }
        }
      }

      // charges
      for (const c of charges) {
        const r = 12;
        ctx.beginPath();
        ctx.arc(c.x * W, c.y * H, r, 0, 2 * Math.PI);
        ctx.fillStyle = c.q > 0 ? '#e34b4b' : '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.q > 0 ? '+' : '−', c.x * W, c.y * H + 1);
      }
    };

    // interaction
    const coord = (e) => {
      const rect = canvas.getBoundingClientRect();
      const ev = e.touches ? e.touches[0] : e;
      return { x: (ev.clientX - rect.left) / rect.width, y: (ev.clientY - rect.top) / rect.height };
    };
    const pick = (p) => {
      for (let i = 0; i < charges.length; i++) {
        const c = charges[i];
        const dx = (p.x - c.x) * canvas.getBoundingClientRect().width;
        const dy = (p.y - c.y) * (canvas.height / (window.devicePixelRatio || 1));
        if (Math.hypot(dx, dy) < 16) return i;
      }
      return -1;
    };
    canvas.addEventListener('pointerdown', (e) => {
      const p = coord(e);
      dragIdx = pick(p);
      didDrag = false;
      if (dragIdx >= 0) canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (dragIdx < 0) return;
      const p = coord(e);
      charges[dragIdx].x = Math.max(0.02, Math.min(0.98, p.x));
      charges[dragIdx].y = Math.max(0.02, Math.min(0.98, p.y));
      didDrag = true;
      draw();
    });
    canvas.addEventListener('pointerup', (e) => {
      if (dragIdx >= 0 && !didDrag) {
        charges[dragIdx].q *= -1;
        draw();
      }
      dragIdx = -1;
    });

    document.getElementById('phys-efield-toggle').addEventListener('click', () => {
      showLines = !showLines; draw();
    });
    document.getElementById('phys-efield-add-pos').addEventListener('click', () => {
      charges.push({ x: 0.5 + (Math.random() - 0.5) * 0.2, y: 0.5 + (Math.random() - 0.5) * 0.2, q: +1 });
      draw();
    });
    document.getElementById('phys-efield-add-neg').addEventListener('click', () => {
      charges.push({ x: 0.5 + (Math.random() - 0.5) * 0.2, y: 0.5 + (Math.random() - 0.5) * 0.2, q: -1 });
      draw();
    });
    document.getElementById('phys-efield-reset').addEventListener('click', () => {
      reset(); draw();
    });
    const gSlider = document.getElementById('phys-efield-grid');
    gSlider.addEventListener('input', () => {
      gridN = parseInt(gSlider.value, 10);
      document.getElementById('phys-efield-grid-v').textContent = gridN;
      draw();
    });

    window.addEventListener('resize', draw);
    draw();
  }

  // ============================================================
  // 2. INFINITE SQUARE WELL
  // ============================================================
  function initSquareWell() {
    const canvas = document.getElementById('phys-well');
    if (!canvas) return;
    let n = 1;
    let c2w = 0; // weight of n=2 admixture (0..1)
    let playing = false;
    let t = 0;
    let raf = null;
    // natural units: ℏ=1, m=1, L=1
    // ψ_n(x) = √2 sin(nπx), E_n = n²π²/2

    const psiN = (k, x) => Math.SQRT2 * Math.sin(k * Math.PI * x);
    const energy = (k) => (k * k * Math.PI * Math.PI) / 2;

    const draw = () => {
      const { ctx, w: W, h: H } = fitCanvas(canvas);
      ctx.clearRect(0, 0, W, H);

      const padL = 40, padR = 14, padT = 22, padB = 28;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      const midY = padT + plotH / 2;

      // walls (well)
      ctx.strokeStyle = isDark() ? '#9ca3af' : '#4b5563';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH);
      ctx.moveTo(padL + plotW, padT); ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      // x-axis (ψ = 0)
      ctx.strokeStyle = grid();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, midY); ctx.lineTo(padL + plotW, midY); ctx.stroke();

      // ψ and |ψ|^2
      const N = 400;
      // normalize so |ψ| fits: max |√2| = √2 ≈ 1.41, so amplitude scale
      const amp = (plotH / 2) * 0.85 / Math.SQRT2;
      const probScale = (plotH / 2) * 0.85 / 2;

      const c1 = Math.sqrt(1 - c2w * c2w);
      const c2 = c2w;
      const E1 = energy(n), E2 = energy(2);

      // probability density |Ψ|²
      ctx.fillStyle = isDark() ? 'rgba(96,165,250,0.22)' : 'rgba(59,130,246,0.20)';
      ctx.beginPath();
      ctx.moveTo(padL, midY);
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        const p1 = psiN(n, x), p2 = psiN(2, x);
        const reP = c1 * p1 * Math.cos(E1 * t) + c2 * p2 * Math.cos(E2 * t);
        const imP = -c1 * p1 * Math.sin(E1 * t) - c2 * p2 * Math.sin(E2 * t);
        const prob = reP * reP + imP * imP;
        const px = padL + x * plotW;
        const py = midY - prob * probScale;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(padL + plotW, midY);
      ctx.closePath();
      ctx.fill();

      // ψ real part (strong line)
      ctx.strokeStyle = isDark() ? '#f59e0b' : '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        const p1 = psiN(n, x), p2 = psiN(2, x);
        const reP = c1 * p1 * Math.cos(E1 * t) + c2 * p2 * Math.cos(E2 * t);
        const px = padL + x * plotW;
        const py = midY - reP * amp;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // ψ imag part (if time-evolving) dashed
      if (c2w > 0 || playing) {
        ctx.strokeStyle = isDark() ? 'rgba(244,114,182,0.75)' : 'rgba(219,39,119,0.7)';
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const x = i / N;
          const p1 = psiN(n, x), p2 = psiN(2, x);
          const imP = -c1 * p1 * Math.sin(E1 * t) - c2 * p2 * Math.sin(E2 * t);
          const px = padL + x * plotW;
          const py = midY - imP * amp;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // labels
      ctx.fillStyle = fg();
      ctx.font = '11px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('ψ (실수부)', padL + 6, padT + 14);
      ctx.fillStyle = isDark() ? '#f472b6' : '#db2777';
      ctx.fillText('ψ (허수부)', padL + 72, padT + 14);
      ctx.fillStyle = isDark() ? '#60a5fa' : '#3b82f6';
      ctx.fillText('|Ψ|²', padL + 140, padT + 14);
      ctx.fillStyle = fg();
      ctx.textAlign = 'center';
      ctx.fillText('x = 0', padL, H - 8);
      ctx.fillText('x = L', padL + plotW, H - 8);
    };

    const loop = () => {
      if (!playing) return;
      t += 0.02;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const nSlider = document.getElementById('phys-well-n');
    const cSlider = document.getElementById('phys-well-c');
    const playBtn = document.getElementById('phys-well-play');
    const update = () => {
      n = parseInt(nSlider.value, 10);
      c2w = parseInt(cSlider.value, 10) / 100;
      document.getElementById('phys-well-n-v').textContent = n;
      document.getElementById('phys-well-c-v').textContent = c2w.toFixed(2);
      document.getElementById('phys-well-E').textContent = `${(n * n).toFixed(0)} · E₁  (E_n ∝ n²)`;
      document.getElementById('phys-well-lambda').textContent = `λ = 2L/${n}`;
      document.getElementById('phys-well-nodes').textContent = String(n - 1);
      draw();
    };
    nSlider.addEventListener('input', update);
    cSlider.addEventListener('input', update);
    playBtn.addEventListener('click', () => {
      playing = !playing;
      playBtn.textContent = playing ? '⏸ 일시정지' : '▶ 재생';
      if (playing) loop(); else if (raf) cancelAnimationFrame(raf);
    });
    window.addEventListener('resize', draw);
    update();
  }

  // ============================================================
  // 3. NONLINEAR PENDULUM (RK4)
  // ============================================================
  function initPendulum() {
    const canvas = document.getElementById('phys-pendulum');
    if (!canvas) return;
    let L = 1.0, g = 9.81, theta0 = Math.PI / 4, damping = 0;
    let theta = theta0, omega = 0;
    let trail = []; // for phase portrait
    let running = true;
    let last = performance.now();
    const DT = 0.002; // integrator step
    let accumulator = 0;

    // Complete elliptic integral of the first kind, AGM method
    const ellipticK = (k) => {
      let a = 1, b = Math.sqrt(1 - k * k);
      for (let i = 0; i < 20; i++) {
        const an = (a + b) / 2;
        b = Math.sqrt(a * b);
        a = an;
        if (Math.abs(a - b) < 1e-12) break;
      }
      return Math.PI / (2 * a);
    };

    const deriv = (th, om) => {
      return { dth: om, dom: -(g / L) * Math.sin(th) - damping * om };
    };

    const step = (h) => {
      const k1 = deriv(theta, omega);
      const k2 = deriv(theta + 0.5 * h * k1.dth, omega + 0.5 * h * k1.dom);
      const k3 = deriv(theta + 0.5 * h * k2.dth, omega + 0.5 * h * k2.dom);
      const k4 = deriv(theta + h * k3.dth, omega + h * k3.dom);
      theta += (h / 6) * (k1.dth + 2 * k2.dth + 2 * k3.dth + k4.dth);
      omega += (h / 6) * (k1.dom + 2 * k2.dom + 2 * k3.dom + k4.dom);
    };

    const reset = () => { theta = theta0; omega = 0; trail = []; };

    const draw = () => {
      const { ctx, w: W, h: H } = fitCanvas(canvas);
      ctx.clearRect(0, 0, W, H);

      // split: left = animation, right = phase portrait
      const splitX = W * 0.55;

      // --- LEFT: pendulum ---
      ctx.strokeStyle = grid();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(splitX, 0); ctx.lineTo(splitX, H); ctx.stroke();

      const pivotX = splitX / 2, pivotY = 60;
      const scale = Math.min(splitX * 0.35, H * 0.55) / 1.2;
      const rodLen = scale * (L / 1.5); // visual scale

      const bobX = pivotX + rodLen * Math.sin(theta);
      const bobY = pivotY + rodLen * Math.cos(theta);

      // swing arc indicator
      ctx.strokeStyle = isDark() ? 'rgba(148,163,184,0.28)' : 'rgba(100,116,139,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, rodLen, Math.PI / 2 - theta0, Math.PI / 2 + theta0);
      ctx.stroke();

      // rod
      ctx.strokeStyle = isDark() ? '#cbd5e1' : '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke();

      // pivot
      ctx.fillStyle = isDark() ? '#e2e8f0' : '#1e293b';
      ctx.beginPath(); ctx.arc(pivotX, pivotY, 4, 0, 2 * Math.PI); ctx.fill();

      // bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, 14, 0, 2 * Math.PI);
      const grad = ctx.createRadialGradient(bobX - 4, bobY - 4, 2, bobX, bobY, 14);
      grad.addColorStop(0, '#fbbf24');
      grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // angle readout
      ctx.fillStyle = fg();
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`θ = ${(theta * 180 / Math.PI).toFixed(1)}°`, 14, H - 32);
      ctx.fillText(`ω = ${omega.toFixed(2)} rad/s`, 14, H - 16);

      // --- RIGHT: phase portrait ---
      const px0 = splitX + 10, py0 = 10, pw = W - splitX - 20, ph = H - 20;
      ctx.strokeStyle = grid();
      ctx.strokeRect(px0, py0, pw, ph);

      // axes center
      const cx = px0 + pw / 2, cy = py0 + ph / 2;
      ctx.beginPath();
      ctx.moveTo(px0, cy); ctx.lineTo(px0 + pw, cy);
      ctx.moveTo(cx, py0); ctx.lineTo(cx, py0 + ph);
      ctx.stroke();

      ctx.fillStyle = fg();
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('θ', px0 + pw - 8, cy - 4);
      ctx.textAlign = 'left';
      ctx.fillText('dθ/dt', cx + 4, py0 + 10);

      // separatrix: E = 2g/L (θ = π, ω = 0 at top)
      const omegaMax = Math.sqrt(2 * g / L) * 1.1;
      const sx = pw / (2 * Math.PI); // θ range [-π, π]
      const sy = ph / (2 * omegaMax);
      ctx.strokeStyle = isDark() ? 'rgba(239,68,68,0.35)' : 'rgba(220,38,38,0.35)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const th = -Math.PI + (2 * Math.PI * i) / 200;
        const om = Math.sqrt(Math.max(0, 2 * (g / L) * (1 + Math.cos(th))));
        const xx = cx + th * sx, yy = cy - om * sy;
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const th = -Math.PI + (2 * Math.PI * i) / 200;
        const om = -Math.sqrt(Math.max(0, 2 * (g / L) * (1 + Math.cos(th))));
        const xx = cx + th * sx, yy = cy - om * sy;
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // trail
      if (trail.length > 1) {
        ctx.strokeStyle = isDark() ? 'rgba(251,191,36,0.75)' : 'rgba(217,119,6,0.8)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < trail.length; i++) {
          const th = ((trail[i].th + Math.PI) % (2 * Math.PI)) - Math.PI;
          const xx = cx + th * sx, yy = cy - trail[i].om * sy;
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
      // current point
      const thN = ((theta + Math.PI) % (2 * Math.PI)) - Math.PI;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx + thN * sx, cy - omega * sy, 4, 0, 2 * Math.PI);
      ctx.fill();
    };

    const loop = () => {
      if (!running) return;
      const now = performance.now();
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp
      accumulator += dt;
      while (accumulator >= DT) {
        step(DT);
        accumulator -= DT;
      }
      if (trail.length === 0 || Math.abs(trail[trail.length - 1].th - theta) > 0.01 ||
          Math.abs(trail[trail.length - 1].om - omega) > 0.01) {
        trail.push({ th: theta, om: omega });
        if (trail.length > 2000) trail.shift();
      }
      draw();
      requestAnimationFrame(loop);
    };

    const Lslider = document.getElementById('phys-pend-L');
    const gSlider = document.getElementById('phys-pend-g');
    const thSlider = document.getElementById('phys-pend-th');
    const dSlider = document.getElementById('phys-pend-d');

    const updateReadouts = () => {
      L = parseInt(Lslider.value, 10) / 100;
      g = parseInt(gSlider.value, 10) / 100;
      const thDeg = parseInt(thSlider.value, 10);
      theta0 = thDeg * Math.PI / 180;
      damping = parseInt(dSlider.value, 10) / 1000;
      document.getElementById('phys-pend-L-v').textContent = L.toFixed(2);
      document.getElementById('phys-pend-g-v').textContent = g.toFixed(2);
      document.getElementById('phys-pend-th-v').textContent = thDeg;
      document.getElementById('phys-pend-d-v').textContent = damping.toFixed(3);

      const Ts = 2 * Math.PI * Math.sqrt(L / g);
      const k = Math.sin(theta0 / 2);
      const Tfull = 4 * Math.sqrt(L / g) * ellipticK(k);
      document.getElementById('phys-pend-Ts').textContent = `${Ts.toFixed(3)} s`;
      document.getElementById('phys-pend-T').textContent = `${Tfull.toFixed(3)} s  (+${((Tfull / Ts - 1) * 100).toFixed(1)}%)`;
      // energy per unit mass: (1/2) L² ω² + gL(1 - cosθ)
      const E = 0.5 * L * L * omega * omega + g * L * (1 - Math.cos(theta));
      document.getElementById('phys-pend-E').textContent = `${E.toFixed(3)} J/kg`;
    };
    [Lslider, gSlider, thSlider, dSlider].forEach((s) =>
      s.addEventListener('input', () => { updateReadouts(); reset(); }));
    document.getElementById('phys-pend-reset').addEventListener('click', () => { reset(); updateReadouts(); });

    window.addEventListener('resize', draw);
    updateReadouts();
    reset();
    requestAnimationFrame(loop);

    // live energy update every few frames
    setInterval(() => {
      const E = 0.5 * L * L * omega * omega + g * L * (1 - Math.cos(theta));
      document.getElementById('phys-pend-E').textContent = `${E.toFixed(3)} J/kg`;
    }, 250);
  }

  // ============================================================
  // 4. DOUBLE SLIT (Fraunhofer)
  // ============================================================
  function initDoubleSlit() {
    const canvas = document.getElementById('phys-slit');
    if (!canvas) return;
    let lam = 550e-9, d = 20e-6, a = 4e-6, Lscreen = 1.0;

    // map wavelength (nm) to RGB (approximate visible spectrum)
    const wavelengthRGB = (wlNm) => {
      let r = 0, g = 0, b = 0;
      if (wlNm >= 380 && wlNm < 440) { r = -(wlNm - 440) / 60; g = 0; b = 1; }
      else if (wlNm < 490) { r = 0; g = (wlNm - 440) / 50; b = 1; }
      else if (wlNm < 510) { r = 0; g = 1; b = -(wlNm - 510) / 20; }
      else if (wlNm < 580) { r = (wlNm - 510) / 70; g = 1; b = 0; }
      else if (wlNm < 645) { r = 1; g = -(wlNm - 645) / 65; b = 0; }
      else if (wlNm <= 780) { r = 1; g = 0; b = 0; }
      let f = 1;
      if (wlNm < 420) f = 0.3 + 0.7 * (wlNm - 380) / 40;
      else if (wlNm > 700) f = 0.3 + 0.7 * (780 - wlNm) / 80;
      return [Math.round(255 * r * f), Math.round(255 * g * f), Math.round(255 * b * f)];
    };

    const draw = () => {
      const { ctx, w: W, h: H } = fitCanvas(canvas);
      ctx.clearRect(0, 0, W, H);
      // split: top = intensity curve, bottom = color fringe band
      const topH = H * 0.62, bandH = H - topH - 12;

      // x on screen from -xmax to +xmax (meters)
      const xmax = 0.05; // 5 cm
      const N = 600;
      const I = new Array(N);
      const [r, g, b] = wavelengthRGB(lam * 1e9);

      let Imax = 0;
      for (let i = 0; i < N; i++) {
        const x = -xmax + (2 * xmax * i) / (N - 1);
        const theta = Math.atan2(x, Lscreen);
        const s = Math.sin(theta);
        const alpha = Math.PI * d * s / lam;
        const beta = Math.PI * a * s / lam;
        const env = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
        const inter = Math.cos(alpha) * Math.cos(alpha);
        I[i] = env * inter;
        if (I[i] > Imax) Imax = I[i];
      }

      // intensity curve
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const px = (i / (N - 1)) * W;
        const py = topH - (I[i] / Imax) * (topH - 20);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // single-slit envelope
      ctx.strokeStyle = isDark() ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = -xmax + (2 * xmax * i) / (N - 1);
        const theta = Math.atan2(x, Lscreen);
        const s = Math.sin(theta);
        const beta = Math.PI * a * s / lam;
        const env = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
        const px = (i / (N - 1)) * W;
        const py = topH - env * (topH - 20);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // axis
      ctx.strokeStyle = grid();
      ctx.beginPath();
      ctx.moveTo(0, topH); ctx.lineTo(W, topH); ctx.stroke();

      // fringe band (color intensity) — draw as thin vertical stripes
      const bandY = topH + 8;
      const stripeW = Math.max(1, W / N);
      for (let i = 0; i < N; i++) {
        const norm = I[i] / Imax;
        const px = (i / N) * W;
        ctx.fillStyle = `rgb(${Math.round(r * norm)},${Math.round(g * norm)},${Math.round(b * norm)})`;
        ctx.fillRect(px, bandY, stripeW + 0.5, bandH);
      }

      // label
      ctx.fillStyle = fg();
      ctx.font = '11px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('강도 I(θ)', 10, 16);
      ctx.textAlign = 'center';
      ctx.fillText('스크린 위 위치 x', W / 2, H - 2);
    };

    const lamS = document.getElementById('phys-slit-lam');
    const dS = document.getElementById('phys-slit-d');
    const aS = document.getElementById('phys-slit-a');
    const LS = document.getElementById('phys-slit-L');

    const update = () => {
      lam = parseInt(lamS.value, 10) * 1e-9;
      d = parseInt(dS.value, 10) * 1e-6;
      a = parseInt(aS.value, 10) * 1e-6;
      Lscreen = parseInt(LS.value, 10) / 100;
      document.getElementById('phys-slit-lam-v').textContent = (lam * 1e9).toFixed(0);
      document.getElementById('phys-slit-d-v').textContent = (d * 1e6).toFixed(0);
      document.getElementById('phys-slit-a-v').textContent = (a * 1e6).toFixed(0);
      document.getElementById('phys-slit-L-v').textContent = Lscreen.toFixed(2);

      // fringe spacing small-angle: Δx = λ L / d
      const dx = lam * Lscreen / d;
      // single-slit first zero: sin θ = λ/a → x ≈ λ L / a
      const env0 = lam * Lscreen / a;
      // visibility: if a < d, sinc envelope doesn't wash fringes; simplest measure = sinc²(πa·Δx/λL) at fringe position
      // practical definition V = (Imax - Imin)/(Imax + Imin) for ideal cos² → 1; envelope reduces
      // Show crude effective visibility = sinc²(πa sin(θ_1)/λ) at first fringe
      const theta1 = Math.asin(lam / d);
      const beta1 = Math.PI * a * Math.sin(theta1) / lam;
      const V = beta1 === 0 ? 1 : Math.pow(Math.sin(beta1) / beta1, 2);

      document.getElementById('phys-slit-fringe').textContent = `Δx ≈ ${(dx * 1000).toFixed(2)} mm`;
      document.getElementById('phys-slit-env').textContent = `±${(env0 * 1000).toFixed(2)} mm`;
      document.getElementById('phys-slit-vis').textContent = V.toFixed(3);
      draw();
    };
    [lamS, dS, aS, LS].forEach((s) => s.addEventListener('input', update));
    window.addEventListener('resize', draw);
    update();
  }

  // ============================================================
  // boot
  // ============================================================
  const boot = () => {
    initEField();
    initSquareWell();
    initPendulum();
    initDoubleSlit();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
