import React, { useEffect, useRef, useState } from 'react';
import './index.css';

// ── Gem SVG mark ──────────────────────────────────────────────
const GemMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="gem-icon-svg">
    <polygon points="16,2 28,10 28,22 16,30 4,22 4,10" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
    <polygon points="16,2 28,10 16,14 4,10" fill="rgba(212,175,55,0.18)" stroke="#D4AF37" strokeWidth="0.75" />
    <polygon points="16,14 28,10 28,22 16,30" fill="rgba(212,175,55,0.08)" stroke="#D4AF37" strokeWidth="0.75" />
    <polygon points="16,14 4,10 4,22 16,30" fill="rgba(212,175,55,0.12)" stroke="#D4AF37" strokeWidth="0.75" />
    <line x1="16" y1="2" x2="16" y2="14" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2,2" />
  </svg>
);

// ── Neural Background — physics-driven neuron simulation ────────
// Free-floating neurons with Brownian drift, cursor repulsion,
// proximity synaptic connections, & signal pulse propagation.
// Scroll triggers cascade activations sweeping the network.

const NeuralBg = () => {
  const canvasRef = useRef(null);
  const glowRef   = useRef(null);
  const stateRef  = useRef({
    mouse:   { x: -9999, y: -9999 },
    lerpPos: { x: -9999, y: -9999 },
    scroll:  0,
    raf:     null,
    triggered: new Set(),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowEl = glowRef.current;
    if (!canvas || !glowEl) return;

    const ctx      = canvas.getContext('2d');
    const N        = 100;      // neuron count
    const CONN     = 150;      // max synapse draw distance (px)
    const REPEL_R  = 140;      // cursor repel radius

    let neurons = [];   // physics particles
    let signals = [];   // traveling pulses

    // ── Init / Resize ──────────────────────────────────────────
    const init = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const W = canvas.width, H = canvas.height;
      neurons = Array.from({ length: N }, () => ({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r:  1.8 + Math.random() * 2.2,   // visual radius
        phase: Math.random() * Math.PI * 2,
        activity: 0,
        glow: 0,
      }));
      signals = [];
    };
    init();
    window.addEventListener('resize', init);

    // ── Mouse tracking ──────────────────────────────────────────
    const onMouse = e => {
      stateRef.current.mouse = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouse);

    // ── Scroll tracking & threshold cascades ────────────────────
    const onScroll = () => {
      const docH  = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docH > 0 ? window.scrollY / docH : 0;
      stateRef.current.scroll = ratio;
      // Wave cascades at key scroll depths
      [0.04, 0.18, 0.38, 0.60, 0.82].forEach((thresh, i) => {
        if (!stateRef.current.triggered.has(i) && ratio >= thresh) {
          stateRef.current.triggered.add(i);
          cascadeWave();
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Fire a neuron ────────────────────────────────────────────
    const fire = (n, str = 1) => {
      n.activity = Math.min(1, n.activity + str);
      n.glow     = Math.min(1, n.glow     + str);
    };

    // ── Spawn a signal pulse to a random nearby neuron ───────────
    const spawnSignal = (from, strength = 1) => {
      // pick a close neighbour
      let best = null, bestD = Infinity;
      for (let k = 0; k < neurons.length; k++) {
        if (neurons[k] === from) continue;
        const dx = neurons[k].x - from.x, dy = neurons[k].y - from.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < CONN && d < bestD && Math.random() < 0.6) {
          bestD = d; best = neurons[k];
        }
      }
      if (!best) return;
      signals.push({
        from, to: best,
        t: 0,
        speed: 0.010 + Math.random() * 0.012,
        // gold or teal signal
        col: Math.random() < 0.55 ? [212, 175, 55] : [0, 220, 180],
        str: strength,
      });
    };

    // ── Cascade: sweep activations left → right ──────────────────
    const cascadeWave = () => {
      const sorted = [...neurons].sort((a, b) => a.x - b.x);
      sorted.forEach((n, i) => {
        const delay = i * 9 + Math.random() * 15;
        setTimeout(() => {
          fire(n, 0.7 + Math.random() * 0.3);
          spawnSignal(n, 0.9);
        }, delay);
      });
    };

    // ── Main draw loop ───────────────────────────────────────────
    let lastT   = performance.now();
    let nextAuto = Date.now() + 600;

    const draw = (ts) => {
      const dt = Math.min(32, ts - lastT) / 16;
      lastT = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;
      const { mouse, scroll } = stateRef.current;

      // Energy ramps with scroll (min 0.3, max 2.0)
      const energy = 0.3 + scroll * 1.7;

      // Glow div — smooth lerp
      const LERP = 0.08;
      const lp = stateRef.current.lerpPos;
      lp.x += (mouse.x - lp.x) * LERP;
      lp.y += (mouse.y - lp.y) * LERP;
      if (lp.x > -9000) glowEl.style.opacity = '1';
      glowEl.style.setProperty('--gx', `${lp.x}px`);
      glowEl.style.setProperty('--gy', `${lp.y}px`);

      // Random ambient spike
      if (Date.now() > nextAuto) {
        const n = neurons[Math.floor(Math.random() * neurons.length)];
        fire(n, 0.4 + Math.random() * 0.5);
        spawnSignal(n, 0.7);
        nextAuto = Date.now() + 400 + Math.random() * 700;
      }

      // ── Update neurons ─────────────────────────────────────────
      neurons.forEach(n => {
        // Cursor repulsion
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < REPEL_R && d > 0) {
          const f = ((1 - d / REPEL_R) ** 1.5) * 2.8;
          n.vx += (dx / d) * f * dt;
          n.vy += (dy / d) * f * dt;
          fire(n, (1 - d / REPEL_R) * 0.10 * dt);
          if (Math.random() < 0.025 * (1 - d / REPEL_R)) spawnSignal(n, 0.8);
        }

        // Soft wall force (pushes inward)
        const WALL = 60;
        if (n.x < WALL)   n.vx += (WALL  - n.x)       * 0.012 * dt;
        if (n.x > W-WALL) n.vx -= (n.x - (W - WALL))  * 0.012 * dt;
        if (n.y < WALL)   n.vy += (WALL  - n.y)        * 0.012 * dt;
        if (n.y > H-WALL) n.vy -= (n.y - (H - WALL))  * 0.012 * dt;

        // Brownian drift
        n.vx += (Math.random() - 0.5) * 0.06 * dt;
        n.vy += (Math.random() - 0.5) * 0.06 * dt;

        // Speed cap (energy-scaled)
        const spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy);
        const cap = 0.6 + energy * 0.55;
        if (spd > cap) { n.vx = (n.vx/spd)*cap; n.vy = (n.vy/spd)*cap; }

        // Damping
        n.vx *= 0.975;
        n.vy *= 0.975;

        n.x += n.vx * dt;
        n.y += n.vy * dt;

        // Breathing phase
        n.phase += 0.018 * dt;
        // Decay
        n.activity *= 0.92;
        n.glow     *= 0.88;
      });

      // ── Draw synaptic connections ──────────────────────────────
      // (Only check unique pairs — O(n²/2). At N=100, ≈5000 pairs.)
      const connAlphaBase = 0.05 + scroll * 0.10;
      for (let i = 0; i < neurons.length; i++) {
        const a = neurons[i];
        for (let j = i + 1; j < neurons.length; j++) {
          const b   = neurons[j];
          const ddx = b.x - a.x, ddy = b.y - a.y;
          const dd  = Math.sqrt(ddx*ddx + ddy*ddy);
          if (dd > CONN) continue;
          const alpha = (1 - dd / CONN) * connAlphaBase;
          const act   = Math.max(a.activity, b.activity);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(80, 120, 200, ${alpha + act * 0.18})`;
          ctx.lineWidth   = 0.55 + act * 1.1;
          ctx.stroke();
        }
      }

      // ── Draw & advance signals ─────────────────────────────────
      signals = signals.filter(s => s.t < 1.0);
      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        s.t += s.speed * dt;
        if (s.t >= 1.0) {
          fire(s.to, s.str * 0.6);
          if (Math.random() < 0.45) spawnSignal(s.to, s.str * 0.75);
          continue;
        }
        const px = s.from.x + (s.to.x - s.from.x) * s.t;
        const py = s.from.y + (s.to.y - s.from.y) * s.t;
        const [r, g, b] = s.col;
        const alpha = Math.sin(s.t * Math.PI) * s.str;

        // Glow orb
        const g1 = ctx.createRadialGradient(px, py, 0, px, py, 12);
        g1.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.85})`);
        g1.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI*2);
        ctx.fillStyle = g1; ctx.fill();
        // Core dot
        ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, alpha * 2.2)})`;
        ctx.fill();
      }

      // ── Draw neurons ───────────────────────────────────────────
      neurons.forEach(n => {
        const act   = n.activity;
        const pulse = 0.5 + 0.5 * Math.sin(n.phase);
        const glow  = n.glow;

        // Color: dark blue-gray → gold as activity rises
        const r  = Math.round(50  + act * 162);   // 50 → 212
        const gr = Math.round(70  + act * 105);   // 70 → 175
        const bl = Math.round(120 - act * 65);    // 120 → 55

        // Outer glow halo
        if (glow > 0.04) {
          const hr  = n.r * 5 + glow * 18;
          const hg  = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, hr);
          hg.addColorStop(0, `rgba(${r},${gr},${bl},${glow * 0.40})`);
          hg.addColorStop(1, `rgba(${r},${gr},${bl},0)`);
          ctx.beginPath(); ctx.arc(n.x, n.y, hr, 0, Math.PI*2);
          ctx.fillStyle = hg; ctx.fill();
        }

        // Node body
        const nr = n.r * (1 + pulse * 0.18 + act * 0.35);
        ctx.beginPath(); ctx.arc(n.x, n.y, nr, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${r},${gr},${bl},${0.35 + act * 0.55 + pulse * (0.08 + scroll * 0.07)})`;
        ctx.fill();

        // Thin ring
        ctx.beginPath(); ctx.arc(n.x, n.y, nr * 2.0, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(${r},${gr},${bl},${(0.06 + act * 0.18) * (0.4 + scroll * 0.6)})`;
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      });

      stateRef.current.raf = requestAnimationFrame(draw);
    };

    stateRef.current.raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', init);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      {/* Physics neuron canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none', zIndex: 1,
        }}
      />

      {/* Smooth radial gradient glow that follows the cursor */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: 0,
          transition: 'opacity 0.6s ease',
          background: `radial-gradient(
            600px circle at var(--gx, 50%) var(--gy, 50%),
            rgba(212, 175, 55, 0.07)   0%,
            rgba(100, 140, 230, 0.06) 35%,
            rgba(150, 100, 220, 0.04) 60%,
            transparent               80%
          )`,
        }}
      />

      {/* Static edge aura */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none', zIndex: 0,
          boxShadow: 'inset 0 0 140px rgba(90, 130, 220, 0.10)',
        }}
      />
    </>
  );
};

// ── Starfield ──────────────────────────────────────────────────
const Starfield = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.6 + 0.1,
      flicker: Math.random() * Math.PI * 2,
      flickerSpeed: Math.random() * 0.02 + 0.005,
    }));

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.flicker += s.flickerSpeed;
        const alpha = s.alpha * (0.7 + 0.3 * Math.sin(s.flicker));
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas starfield" />;
};

// ── Neural Network Canvas ──────────────────────────────────────
// An interactive, multi-layer neural network that pulses with the
// cursor. Nodes activate on hover; signals propagate layer-by-layer.
const NeuralNetworkCanvas = () => {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ mouse: { x: -9999, y: -9999 }, raf: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Network architecture: [input, h1, h2, h3, output] ──────
    const ARCH         = [6, 9, 9, 7, 3];
    const NODE_R       = 7;
    const PAD_X        = 100;  // left/right padding
    const PAD_Y        = 48;   // top/bottom padding

    // Per-layer colors [r,g,b]
    const LAYER_COL = [
      [212, 175,  55],  // gold  — Input
      [160, 120, 230],  // purple
      [ 80, 150, 230],  // blue
      [ 40, 200, 190],  // teal
      [  0, 229, 180],  // mint  — Output
    ];

    let nodes = [];
    let edges = [];
    let nextSpike = Date.now() + 400;

    // ── Build node + edge arrays ──────────────────────────────
    const build = () => {
      const W = canvas.width  = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      nodes = []; edges = [];

      const layerX = ARCH.map((_, li) =>
        PAD_X + (li / (ARCH.length - 1)) * (W - PAD_X * 2));

      ARCH.forEach((count, li) => {
        const x = layerX[li];
        for (let ni = 0; ni < count; ni++) {
          const y = count === 1
            ? H / 2
            : PAD_Y + (ni / (count - 1)) * (H - PAD_Y * 2);
          nodes.push({ x, y, layer: li, activity: 0, glow: 0 });
        }
      });

      // Full connections between adjacent layers
      for (let li = 0; li < ARCH.length - 1; li++) {
        const from = nodes.filter(n => n.layer === li);
        const to   = nodes.filter(n => n.layer === li + 1);
        from.forEach(f => to.forEach(t =>
          edges.push({ from: f, to: t, pulses: [] })
        ));
      }
    };

    build();

    const onResize = () => build();
    window.addEventListener('resize', onResize);

    // ── Mouse tracking (relative to canvas) ──────────────────
    const onMouse = e => {
      const r = canvas.getBoundingClientRect();
      stateRef.current.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    window.addEventListener('mousemove', onMouse);

    // ── Trigger a node: set activity + spawn pulses ───────────
    const fire = (node, strength = 1) => {
      node.activity = Math.min(1, node.activity + strength);
      node.glow     = Math.min(1, node.glow     + strength);
      edges
        .filter(e => e.from === node)
        .forEach(e => e.pulses.push({
          t: 0,
          speed: 0.007 + Math.random() * 0.007,
          col: LAYER_COL[node.layer],
          str: strength,
        }));
    };

    // ── Main draw loop ─────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { mouse } = stateRef.current;
      const now = Date.now();

      // Random input spike to keep animation alive
      if (now > nextSpike) {
        const inputs = nodes.filter(n => n.layer === 0);
        fire(inputs[Math.floor(Math.random() * inputs.length)],
             0.6 + Math.random() * 0.4);
        nextSpike = now + 500 + Math.random() * 700;
      }

      // Cursor proximity on input + first hidden layer
      nodes.forEach(n => {
        if (n.layer > 1) return;
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 90) {
          const s = (1 - d / 90) * 0.35;
          n.activity = Math.min(1, n.activity + s);
          n.glow     = Math.min(1, n.glow     + s * 0.9);
          if (Math.random() < 0.07) fire(n, s * 2.5);
        }
      });

      // Decay node states
      nodes.forEach(n => { n.activity *= 0.91; n.glow *= 0.87; });

      // ── Draw edges + advance pulses ─────────────────────────
      edges.forEach(({ from, to, pulses }) => {
        const act = Math.max(from.activity, to.activity);

        // Edge line
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x,   to.y);
        ctx.strokeStyle = `rgba(100,140,200,${0.06 + act * 0.16})`;
        ctx.lineWidth   = 0.7 + act * 1.2;
        ctx.stroke();

        // Pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.t += p.speed;

          if (p.t >= 1) {
            // Arrived — activate destination
            to.activity = Math.min(1, to.activity + p.str * 0.6);
            to.glow     = Math.min(1, to.glow     + p.str * 0.75);
            // Propagate to next layer (probabilistic)
            if (to.layer < ARCH.length - 1) {
              edges
                .filter(e => e.from === to && Math.random() < 0.65)
                .forEach(e => e.pulses.push({
                  t: 0,
                  speed: 0.006 + Math.random() * 0.008,
                  col: LAYER_COL[to.layer],
                  str: p.str * 0.78,
                }));
            }
            pulses.splice(i, 1);
            continue;
          }

          // Draw pulse glow orb
          const px = from.x + (to.x - from.x) * p.t;
          const py = from.y + (to.y - from.y) * p.t;
          const [r, g, b] = p.col;
          const alpha = Math.sin(p.t * Math.PI) * p.str;

          const g1 = ctx.createRadialGradient(px, py, 0, px, py, 14);
          g1.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.85})`);
          g1.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fillStyle = g1; ctx.fill();

          ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, alpha * 2.2)})`;
          ctx.fill();
        }
      });

      // ── Draw nodes ─────────────────────────────────────────
      nodes.forEach(n => {
        const [r, g, b] = LAYER_COL[n.layer];
        const { activity: act, glow } = n;

        // Outer glow
        if (glow > 0.04) {
          const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, NODE_R * 5 + glow * 22);
          gr.addColorStop(0, `rgba(${r},${g},${b},${glow * 0.45})`);
          gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath(); ctx.arc(n.x, n.y, NODE_R * 5 + glow * 22, 0, Math.PI * 2);
          ctx.fillStyle = gr; ctx.fill();
        }

        // Node body gradient
        const nb = ctx.createRadialGradient(n.x - 2, n.y - 2, 1, n.x, n.y, NODE_R);
        nb.addColorStop(0, `rgba(${r},${g},${b},${0.35 + act * 0.65})`);
        nb.addColorStop(1, `rgba(${r},${g},${b},${0.08 + act * 0.25})`);
        ctx.beginPath(); ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2);
        ctx.fillStyle = nb; ctx.fill();

        // Ring
        ctx.beginPath(); ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.3 + act * 0.65})`;
        ctx.lineWidth   = 1 + act * 1.5;
        ctx.stroke();
      });

      stateRef.current.raf = requestAnimationFrame(draw);
    };

    // Only animate when the canvas is on screen
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (!stateRef.current.raf) draw();
      } else {
        cancelAnimationFrame(stateRef.current.raf);
        stateRef.current.raf = null;
      }
    }, { threshold: 0.05 });
    obs.observe(canvas);
    draw();

    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      obs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ── Mock UI Components (Interactive) ──────────────────────────


const GEM_ITEMS = [
  {
    icon: '💎', name: 'Round Brilliant', sub: '1.42ct · VVS1 · D', val: '$14,200',
    color: '#e8f0fe',
    detail: {
      cert: 'GIA 2206543210',
      cut: 'Excellent',
      polish: 'Excellent',
      symmetry: 'Excellent',
      fluorescence: 'None',
      confidence: 98.4,
      comps: [{ label: 'Antwerp ↗', price: '$13,900' }, { label: 'NY Exchange ↗', price: '$14,600' }],
    },
  },
  {
    icon: '🔷', name: 'Sapphire Cabochon', sub: '3.10ct · Blue · Kashmir', val: '$8,750',
    color: '#e8eaff',
    detail: {
      cert: 'GRS 2025-088412',
      origin: 'Kashmir, India',
      treatment: 'No Heat',
      transparency: 'Translucent',
      fluorescence: 'Inert',
      confidence: 94.1,
      comps: [{ label: 'HK Exchange ↗', price: '$8,200' }, { label: "Sotheby's ↗", price: '$9,100' }],
    },
  },
  {
    icon: '🔴', name: 'Ruby Oval Cut', sub: '2.04ct · Vivid Red · Burma', val: '$22,100',
    color: '#fce8e8',
    detail: {
      cert: 'GIA 5282019034',
      origin: 'Mogok, Myanmar',
      treatment: 'Heat (minor)',
      saturation: 'Vivid',
      fluorescence: 'Strong Red',
      confidence: 96.7,
      comps: [{ label: "Christie's ↗", price: '$21,500' }, { label: 'Antwerp ↗', price: '$22,800' }],
    },
  },
];

const EstimationUI = () => {
  const [active, setActive] = useState(null);

  return (
    <div className="mock-ui" style={{ gap: 10, overflow: 'auto' }}>
      <div className="mock-scan-bar" />
      <div className="mock-header">
        <span className="mock-title">AI Analysis</span>
        <span className="mock-badge">Live</span>
      </div>

      {GEM_ITEMS.map((item, i) => (
        <div key={i}>
          <div
            className="mock-item"
            onClick={() => setActive(active === i ? null : i)}
            style={{
              cursor: 'pointer',
              border: active === i ? '1.5px solid #D4AF37' : undefined,
              background: active === i ? 'rgba(212,175,55,0.07)' : undefined,
              transition: 'all 0.2s',
            }}
          >
            <div className="mock-gem-icon" style={{ background: item.color }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
            </div>
            <div className="mock-item-info">
              <div className="mock-item-name">{item.name}</div>
              <div className="mock-item-sub">{item.sub}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="mock-item-val">{item.val}</div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transform: active === i ? 'rotate(180deg)' : 'none', transition: '0.2s', opacity: 0.4 }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Expanded detail panel */}
          {active === i && (
            <div style={{
              background: 'rgba(212,175,55,0.05)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              animation: 'slide-down 0.2s ease',
            }}>
              {/* Confidence bar */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: '#9aa0a6', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI Confidence</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37' }}>{item.detail.confidence}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${item.detail.confidence}%`, background: '#D4AF37', borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
              </div>
              {/* Spec grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                {Object.entries(item.detail)
                  .filter(([k]) => !['confidence', 'comps'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 3, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: 10, color: '#9aa0a6', textTransform: 'capitalize', fontWeight: 500 }}>{k}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: '#0d0d0d', textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
              </div>
              {/* Market comps */}
              <div>
                <div style={{ fontSize: 10, color: '#9aa0a6', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Market Comps</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {item.detail.comps.map((c, j) => (
                    <div key={j} style={{ flex: 1, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 8, padding: '6px 10px' }}>
                      <div style={{ fontSize: 9, color: '#9aa0a6', marginBottom: 2 }}>{c.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0d0d0d' }}>{c.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const BREAKDOWN_ITEMS = [
  { label: 'Stone Value', val: '$14,200', note: 'D/VVS1 · 1.42ct · Round Brilliant', gold: true },
  { label: 'Setting', val: '$1,830', note: 'Platinum 950 · 4-prong solitaire', gold: false },
  { label: 'Labor', val: '$420', note: 'Hand-set · Polished finish', gold: false },
  { label: 'Market Index', val: '↑ 4.2%', note: 'vs 30-day avg · Antwerp benchmark', gold: true },
];

const BreakdownUI = () => {
  const [hovered, setHovered] = useState(null);
  const [chartHovered, setChartHovered] = useState(null);
  const bars = [40, 55, 35, 60, 45, 70, 55, 80, 65, 90, 75, 100];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="mock-ui dark">
      <div className="mock-header">
        <span className="mock-title light">Itemized Breakdown</span>
        <span className="mock-badge">Certified</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {BREAKDOWN_ITEMS.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: hovered === i ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${hovered === i ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10,
              padding: '10px 14px',
              cursor: 'default',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              {hovered === i
                ? <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{s.note}</div>
                : null
              }
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.gold ? '#D4AF37' : '#fff', whiteSpace: 'nowrap' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Chart with hover tooltip */}
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="mock-stat-label">30-day Price Trend</div>
          {chartHovered !== null && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#D4AF37' }}>
              {months[chartHovered]}: ${(9000 + bars[chartHovered] * 55).toLocaleString()}
            </span>
          )}
        </div>
        <div className="mock-chart" style={{ position: 'relative' }}>
          {bars.map((h, i) => (
            <div
              key={i}
              onMouseEnter={() => setChartHovered(i)}
              onMouseLeave={() => setChartHovered(null)}
              className={`mock-bar dark${i >= 9 ? ' active' : ''}`}
              style={{
                height: `${h}%`,
                background: chartHovered === i ? '#fff' : (i >= 9 ? '#D4AF37' : 'rgba(255,255,255,0.12)'),
                cursor: 'crosshair',
                transform: chartHovered === i ? 'scaleY(1.08)' : 'none',
                transformOrigin: 'bottom',
                transition: 'all 0.1s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MARKET_ROWS = [
  {
    label: 'D/VVS1 1ct Round', bid: '$9,200', ask: '$9,800', delta: '+2.1%', up: true,
    detail: { exchange: 'Antwerp Diamond Bourse', volume: '234 trades/day', spread: '$600', lastSale: '$9,480', change7d: '+4.8%' }
  },
  {
    label: 'Ruby Vivid 2ct Oval', bid: '$21,500', ask: '$23,000', delta: '+5.4%', up: true,
    detail: { exchange: 'HK Jewellery Exchange', volume: '48 trades/day', spread: '$1,500', lastSale: '$22,100', change7d: '+9.1%' }
  },
  {
    label: 'Kashmir Sapphire 3ct', bid: '$7,100', ask: '$7,900', delta: '-1.2%', up: false,
    detail: { exchange: 'CIBJO Geneva', volume: '31 trades/day', spread: '$800', lastSale: '$7,450', change7d: '-0.6%' }
  },
];

const MarketUI = () => {
  const [active, setActive] = useState(null);

  return (
    <div className="mock-ui">
      <div className="mock-header">
        <span className="mock-title">Market Intelligence</span>
        <span className="mock-badge">Real-time</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MARKET_ROWS.map((m, i) => (
          <div key={i}>
            <div
              onClick={() => setActive(active === i ? null : i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: active === i ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.04)',
                borderRadius: active === i ? '10px 10px 0 0' : 10,
                padding: '10px 14px',
                border: `1px solid ${active === i ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0d0d0d', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#9aa0a6' }}>Bid {m.bid} · Ask {m.ask}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.up ? '#1e8e3e' : '#ea4335' }}>{m.delta}</span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transform: active === i ? 'rotate(180deg)' : 'none', transition: '0.2s', opacity: 0.35 }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {active === i && (
              <div style={{
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                padding: '10px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 16px',
                animation: 'slide-down 0.2s ease',
              }}>
                {Object.entries(m.detail).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 5 }}>
                    <span style={{ fontSize: 10, color: '#9aa0a6', textTransform: 'capitalize', fontWeight: 500 }}>
                      {k.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0d0d0d' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mock-stat-grid" style={{ marginTop: 'auto' }}>
        <div className="mock-stat">
          <div className="mock-stat-label">Queries/day</div>
          <div className="mock-stat-val" style={{ fontSize: 22 }}>42K</div>
        </div>
        <div className="mock-stat">
          <div className="mock-stat-label">Accuracy</div>
          <div className="mock-stat-val gold" style={{ fontSize: 22 }}>99.4%</div>
        </div>
      </div>
    </div>
  );
};

// ── FAB Icon SVGs ──────────────────────────────────────────────
const SunIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);
const InvertIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3v18"/>
    <path d="M12 3a9 9 0 010 18" fill="currentColor" stroke="none"/>
  </svg>
);
const ChevronUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 15l-6-6-6 6"/>
  </svg>
);

// ── Floating Action Buttons ───────────────────────────────────
const THEMES = ['light', 'dark', 'invert'];

const FloatingButtons = ({ theme, setTheme }) => {
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct  = docH > 0 ? window.scrollY / docH : 0;
      setScrollPct(pct);
      setShowTop(pct > 0.15);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cycleTheme = () => {
    setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Button colours adapt: light bg → dark FAB; dark/invert bg → light FAB
  const fabBg    = theme === 'light' ? '#0d0d0d' : '#f0f2f5';
  const fabColor = theme === 'light' ? '#f0f2f5' : '#0d0d0d';
  const fabShadow = theme === 'light'
    ? '0 4px 24px rgba(0,0,0,0.22)'
    : '0 4px 24px rgba(0,0,0,0.55)';

  const fabBase = {
    position: 'fixed', width: 48, height: 48, borderRadius: '50%',
    background: fabBg, color: fabColor,
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, boxShadow: fabShadow,
    transition: 'all 0.25s cubic-bezier(0.2,0,0,1)',
    outline: 'none',
  };

  const THEME_LABEL = { light: 'Dark mode', dark: 'Invert mode', invert: 'Light mode' };

  return (
    <>
      {/* Theme toggle — bottom left */}
      <button
        id="fab-theme"
        onClick={cycleTheme}
        title={THEME_LABEL[theme]}
        style={{ ...fabBase, bottom: 24, left: 24 }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.06)'; e.currentTarget.style.boxShadow = fabShadow.replace('0.22','0.35'); }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = fabShadow; }}
      >
        {theme === 'light'  && <SunIcon />}
        {theme === 'dark'   && <MoonIcon />}
        {theme === 'invert' && <InvertIcon />}
      </button>

      {/* Scroll to top — bottom right */}
      <button
        id="fab-top"
        onClick={scrollToTop}
        title="Back to top"
        style={{
          ...fabBase, bottom: 24, right: 24,
          opacity: showTop ? 1 : 0,
          pointerEvents: showTop ? 'auto' : 'none',
          transform: showTop ? 'translateY(0)' : 'translateY(10px)',
        }}
        onMouseEnter={e => { if (showTop) { e.currentTarget.style.transform = 'translateY(-2px) scale(1.06)'; }}}
        onMouseLeave={e => { if (showTop) { e.currentTarget.style.transform = 'translateY(0)'; }}}
      >
        <ChevronUpIcon />
      </button>
    </>
  );
};

// ── Nav ─────────────────────────────────────────────────────────────────────────
const Nav = () => {
  const navRef = useRef(null);
  useEffect(() => {
    const handler = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 20);
      }
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className="nav" ref={navRef}>
      <a href="#" className="nav-logo">
        <GemMark size={28} />
        Caratsense
      </a>
      <div className="nav-links">
        {['Product', 'Use Cases', 'Pricing', 'Blog', 'Docs'].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(' ','')}`} className="nav-link">{l}</a>
        ))}
      </div>
      <div className="nav-actions">
        <a href="#pricing" className="btn btn-ghost">Request Demo</a>
        <a href="#pricing" className="btn btn-dark">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 8a5 5 0 1 1 10 0A5 5 0 0 1 3 8zm5-3.5a.5.5 0 0 0-1 0V8a.5.5 0 0 0 .146.354l2 2a.5.5 0 0 0 .708-.708L8 8.293V4.5z"/></svg>
          Get Started
        </a>
      </div>
    </nav>
  );
};

// ── Scroll-fade hook ───────────────────────────────────────────
const useFadeIn = () => {
  useEffect(() => {
    const els = document.querySelectorAll('.fade-in');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
};

// ── App ────────────────────────────────────────────────────────
export default function App() {
  useFadeIn();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      {/* Cursor effects + FABs — outside the invertable zone */}
      <NeuralBg />
      <FloatingButtons theme={theme} setTheme={setTheme} />

      {/* All page content — CSS inverts this in 'invert' theme */}
      <div id="page-content">
      <Nav />

      {/* ── HERO ── */}
      <section className="hero" id="product">
        <div className="hero-content">
          <div className="hero-badge fade-in">
            <span className="dot" />
            Now with real-time market intelligence
          </div>
          <h1 className="hero-title fade-in fade-in-delay-1">
            Experience clarity with<br />
            <em>AI-powered jewelry</em><br />
            estimation
          </h1>
          <p className="hero-subtitle fade-in fade-in-delay-2">
            Caratsense is the intelligence layer for gemstone professionals. Instant AI valuations, itemized breakdowns, and live market pricing — engineered for accuracy at scale.
          </p>
          <div className="hero-actions fade-in fade-in-delay-3">
            <a href="#pricing" className="btn btn-dark">
              <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 1a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm-.5 4a.5.5 0 0 1 1 0v3.293l1.854 1.853a.5.5 0 0 1-.708.708L7.5 9.707V6z"/></svg>
              Start Free Trial
            </a>
            <a href="#usecases" className="btn btn-ghost">Explore use cases</a>
          </div>
        </div>
        <div className="scroll-indicator" aria-hidden="true">
          <div className="scroll-line" />
        </div>
      </section>

      {/* ── LOGOS ── */}
      <div className="logos">
        <div className="logos-inner">
          <p className="logos-label">Trusted by professionals across the jewelry industry</p>
          <div className="logos-grid">
            {["Sotheby's Gems", 'De Beers Select', "Christie's JW", 'Tiffany Partners', 'GIA Alumni', 'Antwerp Exchange'].map(l => (
              <span key={l} className="logo-item">{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATEMENT ── */}
      <section className="statement">
        <div className="statement-inner">
          <p className="statement-label">Our Mission</p>
          <p className="statement-text">
            Caratsense is our <strong>AI estimation engine</strong>, evolving jewelry appraisal<br />
            into the data-first era — for professionals who can't afford to be wrong.
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" id="usecases">
        <div className="section-inner">
          <div className="section-header fade-in">
            <p className="section-label">Core Platform</p>
            <h2 className="section-title">Everything your appraisal workflow needs</h2>
            <p className="section-desc">One unified platform for instant AI estimation, deep market data, and audit-ready outputs.</p>
          </div>

          {/* Feature 1 */}
          <div className="feature-row fade-in">
            <div className="feature-text">
              <span className="feature-tag">Instant AI Estimation</span>
              <h3 className="feature-heading">Deep AI Analysis Core</h3>
              <p className="feature-body">
                Caratsense's estimation engine identifies gemstone type, cut quality, clarity grade, and color from structured inputs — delivering a certified market value in under 2 seconds with provenance-aware pricing.
              </p>
              <a href="#" className="feature-link">
                See how it works
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              </a>
            </div>
            <div className="feature-preview">
              <EstimationUI />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="feature-row reverse fade-in">
            <div className="feature-text">
              <span className="feature-tag">Itemized Breakdowns</span>
              <h3 className="feature-heading">Higher-level cost intelligence</h3>
              <p className="feature-body">
                Move beyond single-figure quotes. Caratsense delivers a full itemized breakdown — stone, setting, craft, and market index — presented as a trustworthy artifact your clients can actually read.
              </p>
              <a href="#" className="feature-link">
                Explore breakdowns
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              </a>
            </div>
            <div className="feature-preview dark">
              <BreakdownUI />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="feature-row fade-in">
            <div className="feature-text">
              <span className="feature-tag">Market Intelligence</span>
              <h3 className="feature-heading">Live market data, always current</h3>
              <p className="feature-body">
                Real-time bid/ask pricing across diamond, ruby, sapphire, and emerald categories. Synchronized with major clearing venues — Antwerp, Hong Kong, NY — for pricing you can stand behind.
              </p>
              <a href="#" className="feature-link">
                View market data
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              </a>
            </div>
            <div className="feature-preview">
              <MarketUI />
            </div>
          </div>

          {/* Feature 4 — full width statement row */}
          <div className="feature-row fade-in" style={{ gridTemplateColumns: '1fr', textAlign: 'center', padding: '80px 0 40px' }}>
            <div className="feature-text" style={{ maxWidth: 580, margin: '0 auto' }}>
              <span className="feature-tag">Multi-source Agents</span>
              <h3 className="feature-heading">An appraisal-first experience</h3>
              <p className="feature-body">
                Run parallel estimations across multiple lots simultaneously. From one central dashboard, manage batch submissions, export GIA-compatible reports, and integrate direct API access into your existing ERP.
              </p>
              <a href="#pricing" className="btn btn-dark" style={{ marginTop: 8, display: 'inline-flex' }}>
                Explore the platform
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* ── TRUST ── */}
      <section className="trust">
        <div className="trust-inner">
          <div className="fade-in">
            <p className="trust-label">Built for Trust</p>
            <h2 className="trust-title">Engineered for professionals in the data-first era</h2>
            <p className="trust-body">
              Caratsense is purpose-built for certified gemologists, independent appraisers, luxury auction houses, and insurance underwriters — to any professional who requires defensible, audit-ready valuations.
            </p>
            <a href="#pricing" className="btn btn-gold">Request enterprise access</a>
          </div>
          <div className="fade-in fade-in-delay-1">
            <div className="trust-stats" style={{ marginBottom: 36 }}>
              {[
                { val: '99.4%', label: 'Estimation accuracy on certified stones' },
                { val: '<2s', label: 'Average AI valuation turnaround' },
                { val: '12M+', label: 'Gemstones in our pricing corpus' },
                { val: '50+', label: 'Market venues integrated globally' },
              ].map((s, i) => (
                <div key={i} className="trust-stat">
                  <div className="trust-stat-val">{s.val}</div>
                  <div className="trust-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="trust-visual">
              {[
                { icon: '🔒', title: 'SOC 2 Type II Certified', sub: 'Your data never trains our models' },
                { icon: '📋', title: 'GIA-compatible Outputs', sub: 'Export directly to your reporting suite' },
                { icon: '🌐', title: 'Global Market Coverage', sub: '50+ venues · 24/7 live feeds' },
              ].map((c, i) => (
                <div key={i} className="trust-card">
                  <div className="trust-card-icon">{c.icon}</div>
                  <div className="trust-card-text">
                    <div className="trust-card-title">{c.title}</div>
                    <div className="trust-card-sub">{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <div className="pricing-header fade-in">
            <p className="section-label">Pricing</p>
            <h2 className="section-title" style={{ textAlign: 'center' }}>For appraisers.<br />For enterprises.</h2>
          </div>
          <div className="pricing-grid fade-in fade-in-delay-1">
            {/* Pro */}
            <div className="pricing-card">
              <div className="pricing-plan">For professionals</div>
              <div className="pricing-headline">Available at no charge.</div>
              <div className="pricing-tagline">Achieve precision at scale.</div>
              <ul className="pricing-features">
                {[
                  '50 AI estimations per month',
                  'Full itemized breakdown output',
                  'Basic market data access',
                  'PDF export (GIA-compatible format)',
                  'Email support',
                ].map((f, i) => (
                  <li key={i} className="pricing-feature">
                    <span className="pricing-feature-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#" className="btn btn-dark">Start for free</a>
            </div>
            {/* Enterprise */}
            <div className="pricing-card featured">
              <div className="pricing-plan">For organizations</div>
              <div className="pricing-headline" style={{ color: '#fff' }}>Coming soon.</div>
              <div className="pricing-tagline">Level up your entire team.</div>
              <ul className="pricing-features">
                {[
                  'Unlimited AI estimations',
                  'Full real-time market intelligence',
                  'Batch API access (REST + GraphQL)',
                  'Custom model fine-tuning',
                  'SSO, RBAC & audit logs',
                  'Dedicated account manager',
                  'SLA with 99.9% uptime guarantee',
                ].map((f, i) => (
                  <li key={i} className="pricing-feature">
                    <span className="pricing-feature-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#" className="btn btn-gold">Notify me</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOGS ── */}
      <section className="blogs" id="blog">
        <div className="blogs-inner">
          <div className="blogs-header">
            <h2 className="section-title fade-in">Latest insights</h2>
            <a href="#" className="btn btn-ghost fade-in">View all posts</a>
          </div>
          <div className="blogs-grid">
            {[
              {
                tag: 'AI Research',
                title: 'How our model achieves 99.4% accuracy on GIA-certified diamonds',
                gradient: 'linear-gradient(135deg, #0a0a14, #111128)',
                accent: '#2563eb',
              },
              {
                tag: 'Market Data',
                title: 'Ruby prices at 10-year high — what the data tells us',
                gradient: 'linear-gradient(135deg, #140a0a, #281111)',
                accent: '#dc2626',
              },
              {
                tag: 'Product',
                title: 'Introducing batch API: estimate entire lots in minutes',
                gradient: 'linear-gradient(135deg, #0a1209, #111f0e)',
                accent: '#D4AF37',
              },
            ].map((b, i) => (
              <div key={i} className={`blog-card fade-in fade-in-delay-${i}`}>
                <div className="blog-card-bg">
                  <div className="blog-gem-visual" style={{ background: b.gradient, position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
                    {/* Abstract gem dots */}
                    {Array.from({ length: 30 }).map((_, j) => (
                      <div key={j} style={{
                        position: 'absolute',
                        width: Math.random() * 4 + 1,
                        height: Math.random() * 4 + 1,
                        borderRadius: '50%',
                        background: b.accent,
                        opacity: Math.random() * 0.5 + 0.1,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }} />
                    ))}
                    <GemMark size={64} />
                  </div>
                </div>
                <div className="blog-card-overlay" />
                <div className="blog-card-content">
                  <div className="blog-card-tag">{b.tag}</div>
                  <div className="blog-card-title">{b.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <div className="footer-cta">
        <Starfield />
        <div className="footer-cta-inner">
          <div className="footer-cta-logo">Caratsense</div>
          <h2 className="footer-cta-title">Experience liftoff</h2>
          <p className="footer-cta-sub">
            The most precise AI jewelry estimation platform, available today. Join professionals across 40+ countries.
          </p>
          <div className="footer-cta-actions">
            <a href="#" className="btn btn-gold">Start Free Trial</a>
            <a href="#" className="btn btn-outline-dark">Request Demo</a>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand-logo">
                <GemMark size={22} />
                Caratsense
              </div>
              <p className="footer-brand-desc">
                AI-powered jewelry estimation for professionals who can't afford to be wrong.
              </p>
              <div className="footer-socials">
                {['𝕏', 'in', 'gh', '▷'].map((s, i) => (
                  <a key={i} href="#" className="footer-social-link">{s}</a>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'API Docs', 'Changelog', 'Status'] },
              { title: 'Use Cases', links: ['Appraisers', 'Auction Houses', 'Insurers', 'Retailers', 'Labs'] },
              { title: 'Resources', links: ['Blog', 'Guides', 'Press', 'Releases', 'Brand Kit'] },
              { title: 'Company', links: ['About', 'Careers', 'Contact', 'Privacy', 'Terms'] },
            ].map(col => (
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                <ul className="footer-links">
                  {col.links.map(l => (
                    <li key={l}><a href="#">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span className="footer-copyright">© 2025 Caratsense Inc. All rights reserved.</span>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Brand Guidelines</a>
            </div>
          </div>
        </div>
      </footer>
      </div>{/* end #page-content */}
    </>
  );
}
