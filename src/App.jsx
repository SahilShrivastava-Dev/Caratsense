import React, { useEffect, useRef, useState } from 'react';
import HeroOrganicNetwork from './components/HeroOrganicNetwork';
import FeatureCarousel from './components/FeatureCarousel';
import ZoomParallax from './components/ZoomParallax';
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
  const stateRef = useRef({ mouse: { x: -9999, y: -9999 }, raf: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Network architecture: [input, h1, h2, h3, output] ──────
    const ARCH = [6, 9, 9, 7, 3];
    const NODE_R = 7;
    const PAD_X = 100;  // left/right padding
    const PAD_Y = 48;   // top/bottom padding

    // Per-layer colors [r,g,b]
    const LAYER_COL = [
      [212, 175, 55],  // gold  — Input
      [160, 120, 230],  // purple
      [80, 150, 230],  // blue
      [40, 200, 190],  // teal
      [0, 229, 180],  // mint  — Output
    ];

    let nodes = [];
    let edges = [];
    let nextSpike = Date.now() + 400;

    // ── Build node + edge arrays ──────────────────────────────
    const build = () => {
      const W = canvas.width = canvas.offsetWidth;
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
        const to = nodes.filter(n => n.layer === li + 1);
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
      node.glow = Math.min(1, node.glow + strength);
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
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) {
          const s = (1 - d / 90) * 0.35;
          n.activity = Math.min(1, n.activity + s);
          n.glow = Math.min(1, n.glow + s * 0.9);
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
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = `rgba(100,140,200,${0.06 + act * 0.16})`;
        ctx.lineWidth = 0.7 + act * 1.2;
        ctx.stroke();

        // Pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.t += p.speed;

          if (p.t >= 1) {
            // Arrived — activate destination
            to.activity = Math.min(1, to.activity + p.str * 0.6);
            to.glow = Math.min(1, to.glow + p.str * 0.75);
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
        ctx.lineWidth = 1 + act * 1.5;
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

// ── Capability Explorer ──────────────────────────────
// Legacy CapabilityExplorer removed in favor of FeatureCarousel

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
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);
const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);
const InvertIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v18" />
    <path d="M12 3a9 9 0 010 18" fill="currentColor" stroke="none" />
  </svg>
);
const ChevronUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 15l-6-6-6 6" />
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
      const pct = docH > 0 ? window.scrollY / docH : 0;
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
  const fabBg = theme === 'light' ? '#0d0d0d' : '#f0f2f5';
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
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.06)'; e.currentTarget.style.boxShadow = fabShadow.replace('0.22', '0.35'); }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = fabShadow; }}
      >
        {theme === 'light' && <SunIcon />}
        {theme === 'dark' && <MoonIcon />}
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
        onMouseEnter={e => { if (showTop) { e.currentTarget.style.transform = 'translateY(-2px) scale(1.06)'; } }}
        onMouseLeave={e => { if (showTop) { e.currentTarget.style.transform = 'translateY(0)'; } }}
      >
        <ChevronUpIcon />
      </button>
    </>
  );
};

// ── Nav ─────────────────────────────────────────────────────────────────────────
// ── Nav ─────────────────────────────────────────────────────────────────────────
const Nav = ({ onMenuOpen }) => {
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
        <img src="/logo.jpeg" alt="CaratSense" className="nav-logo-img" />
        <span>Caratsense</span>
      </a>
      <div className="nav-links">
        {['What We Build', 'Testimonials', 'Start Conversation'].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '')}`} className="nav-link">{l}</a>
        ))}
      </div>
      <div className="nav-actions">
        <a href="#whatwebuild" className="btn btn-ghost">See Our Work</a>
        <a href="#startconversation" className="btn btn-dark">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 8a5 5 0 1 1 10 0A5 5 0 0 1 3 8zm5-3.5a.5.5 0 0 0-1 0V8a.5.5 0 0 0 .146.354l2 2a.5.5 0 0 0 .708-.708L8 8.293V4.5z" /></svg>
          <span className="btn-text">Start Conversation</span>
        </a>
        <button className="mobile-menu-toggle" onClick={onMenuOpen}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </nav>
  );
};

const AboutModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="about-modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="about-modal-panel has-parallax" 
        onClick={e => e.stopPropagation()}
      >
        <button className="about-modal-close" onClick={onClose} aria-label="Close" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <ZoomParallax 
          containerRef={modalRef}
          subtitle="Meet the Architects"
          title="The Gravity of Data"
          images={[
            { src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200", alt: "Data Visualization" },
            { src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200", alt: "Engineering" },
            { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200", alt: "Collaboration" },
            { src: "https://images.unsplash.com/photo-1551288049-bbda38a10ad5?q=80&w=1200", alt: "Analytics" },
            { src: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200", alt: "Mobile Solutions" },
            { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200", alt: "Strategy" },
            { src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200", alt: "Innovation" },
          ]}
        >
          <div className="team-section">
            <p className="section-label" style={{ color: '#c026d3' }}>The People Behind Caratsense</p>
            <h2 className="section-title">Meet Our Team</h2>
            <p className="section-desc">We are a group of engineers and architects obsessed with making systems that actually work.</p>
            
            <div className="team-grid">
              {[
                { name: 'Sahil Shrivastava', role: 'Founder & Tech Lead', bio: 'Specialist in high-performance data architecture and custom ERP development. Built the core Caratsense engine.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop' },
                { name: 'Vinay K.', role: 'Operations Strategy', bio: 'Expert in Indian supply chain bottlenecks. Maps the operational audit into digital roadmaps.', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop' },
                { name: 'Ananya R.', role: 'Head of AI Integration', bio: 'Leads our NLP and Computer Vision modules, integrating state-of-the-art intelligence into daily workflows.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop' }
              ].map((m, i) => (
                <div key={i} className="team-card">
                  <div className="team-avatar">
                    <img src={m.img} alt={m.name} />
                  </div>
                  <div className="team-name">{m.name}</div>
                  <div className="team-role">{m.role}</div>
                  <p className="team-bio">{m.bio}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '80px', textAlign: 'center' }}>
              <a href="#startconversation" className="btn btn-gold" onClick={onClose}>
                Partner With Us
              </a>
            </div>
          </div>
        </ZoomParallax>
      </div>
    </div>
  );
};

const MobileMenu = ({ isOpen, onClose }) => {
  const links = ['What We Build', 'Testimonials', 'Start Conversation'];

  return (
    <div className={`mobile-menu-overlay ${isOpen ? 'active' : ''}`}>
      <button className="mobile-menu-close" onClick={onClose}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div className="mobile-menu-links">
        {links.map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '')}`} className="mobile-menu-link" onClick={onClose}>
            {l}
          </a>
        ))}
        <a href="#startconversation" className="btn btn-dark" style={{ marginTop: 20, justifyContent: 'center' }} onClick={onClose}>
          Start Conversation
        </a>
      </div>
    </div>
  );
};

// ── Workflow Showcase ──────────────────────────────────────────
// ── Workflow Showcase ──────────────────────────────────────────
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
  const [theme, setTheme] = useState('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsPageLoading(false), 800);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Lock scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);

  return (
    <>
      <div className={`loader-overlay ${!isPageLoading ? 'fade-out' : ''}`}>
        <dotlottie-wc
          src="https://lottie.host/9eda103f-d44d-426f-ada1-ca59acc009ce/fjs6qAMHJ1.lottie"
          style={{ width: '300px', height: '300px' }}
          autoplay
          loop
        />
      </div>

      <FloatingButtons theme={theme} setTheme={setTheme} />
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Hero + all page content */}
      <div id="page-content" style={{ position: 'relative', zIndex: 1, opacity: isPageLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
        <Nav onMenuOpen={() => setIsMenuOpen(true)} />
        <HeroOrganicNetwork onSunClick={() => setIsAboutOpen(true)} />
        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

        {/* ── WHAT WE BUILD (INTERACTIVE EXPLORER) ── */}
        <section className="section explorer-section" id="whatwebuild">
          <div className="section-inner">
            <div className="section-header fade-in" style={{ marginBottom: 40 }}>
              <p className="section-label">Core Capabilities</p>
              <h2 className="section-title">High-Performance Operational Systems</h2>
              <p className="section-desc">We build the nervous system for your business. Hover over a module to explore the architecture.</p>
            </div>

            <div className="explorer-container fade-in">
              <FeatureCarousel />
            </div>
          </div>
        </section>

        {/* ── SECTORS MARQUEE ── */}
        <div className="logos sectors-marquee">
          <div className="logos-inner">
            <p className="logos-label">Delivering results across every major industry</p>
            <div className="marquee-container">
              <div className="marquee-content marquee-content--fast">
                {[
                  'Retail', 'Manufacturing', 'Real Estate', 'F&B', 'Jewellery', 'Hospitality', 'Specialty Chemicals', 'Building Materials', 'Watches', 'Aviation', 'Student Housing', 'Bakery', 'FMCG Distribution', 'Advertising & Exhibitions', 'Legal Services', 'Textile & Fashion', 'R&D',
                  // Duplicate for infinite loop
                  'Retail', 'Manufacturing', 'Real Estate', 'F&B', 'Jewellery', 'Hospitality', 'Specialty Chemicals', 'Building Materials', 'Watches', 'Aviation', 'Student Housing', 'Bakery', 'FMCG Distribution', 'Advertising & Exhibitions', 'Legal Services', 'Textile & Fashion', 'R&D'
                ].map((l, i) => (
                  <span key={i} className="logo-item">{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TESTIMONIALS (VERTICAL COLUMNS) ── */}
        <section className="section bg-darker" id="testimonials">
          <div className="section-inner">
            <div className="section-header fade-in">
              <p className="section-label">Client Stories</p>
              <h2 className="section-title">Trusted by industry leaders</h2>
            </div>
          </div>

          {(() => {
            const all = [
              { name: 'Rajesh Khanna', role: 'Founder, Khanna Jewellery', text: 'Caratsense AI transformed our wholesale operations. The WhatsApp CRM allowed us to delegate sales follow-ups without losing that personal touch.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&h=120&auto=format&fit=crop' },
              { name: 'Priya Sharma', role: 'CEO, Urban Threads', text: 'They researched our warehouse workflow and built a system that flags slow-moving stock before it becomes a liability. A game-changer.', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&h=120&auto=format&fit=crop' },
              { name: 'Anil Mehta', role: 'Director, Mehta Manufacturing', text: 'They integrated our machine data directly with our billing software, giving us real-time visibility into production costs we never thought possible.', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&h=120&auto=format&fit=crop' },
              { name: 'Sameer Joshi', role: 'Owner, Joshi Specialty Chemicals', text: 'We now have a unified decisioning layer that pulls from our factory floor and sales team chats. Incredible efficiency and clarity.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&h=120&auto=format&fit=crop' },
              { name: 'Anjali Desai', role: 'Director, Desai Building Materials', text: 'They found bottlenecks in our supply chain we didn\'t know existed. The dashboard they built is now our most used management tool.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&h=120&auto=format&fit=crop' },
              { name: 'Karan Malhotra', role: 'Founder, Malhotra Aviation', text: 'Caratsense built us a native field app that actually works in low-connectivity areas. Truly bespoke engineering for Indian ops.', image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=120&h=120&auto=format&fit=crop' },
            ];
            const cols = [
              { items: [all[0], all[3]], speed: 18 },
              { items: [all[1], all[4]], speed: 24 },
              { items: [all[2], all[5]], speed: 20 },
            ];
            return (
              <div className="tvcol-wrapper fade-in">
                {cols.map((col, ci) => (
                  <div key={ci} className="tvcol" style={{ '--tvcol-dur': `${col.speed}s` }}>
                    {/* Duplicate cards for seamless loop */}
                    {[0, 1].map(rep => (
                      <div key={rep} className="tvcol-set">
                        {col.items.map((t, ti) => (
                          <div key={ti} className="testimonial-card">
                            <p className="testimonial-text">"{t.text}"</p>
                            <div className="testimonial-header" style={{ marginTop: '20px', marginBottom: 0 }}>
                              <div className="testimonial-avatar">
                                <img src={t.image} alt={t.name} />
                              </div>
                              <div className="testimonial-meta">
                                <div className="testimonial-name">{t.name}</div>
                                <div className="testimonial-role">{t.role}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

        {/* ── START CONVERSATION ── */}
        <section className="section" id="startconversation">
          <div className="section-inner">
            <div className="conversation-block fade-in">
              <div className="conv-layout">
                <div className="conv-lottie">
                  <dotlottie-wc
                    src="https://lottie.host/aae85447-c777-49f3-a80f-ba42ab737339/KapxeB4dH9.lottie"
                    style={{ width: '240px', height: '240px' }}
                    autoplay
                    loop
                  />
                </div>
                <div className="conv-text">
                  <p className="section-label" style={{ color: 'var(--accent-amber)' }}>Let's Talk</p>
                  <h2 className="section-title">Ready to build?</h2>
                  <p className="section-desc">
                    If you're looking for custom solutions, data privacy, robust software architecture, reliable customer support, or a proven reputation among industry leaders — let's start the conversation.
                  </p>
                </div>
                <div className="conv-cta-box">
                  <a
                    href="https://api.whatsapp.com/send/?phone=919309137416&text=Hi%2C+I+want+to+build+custom+operational+software+for+my+business&type=phone_number&app_absent=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold btn-large"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.747-2.874-2.512-2.96-2.626-.087-.115-.708-.943-.708-1.799 0-.856.448-1.277.607-1.45.159-.174.347-.218.463-.218.116 0 .232.001.332.005.108.004.254-.041.398.305.144.347.491 1.199.535 1.286.044.086.073.187.015.303-.059.117-.088.19-.174.29-.087.101-.183.226-.261.303-.098.097-.2.202-.085.4.115.197.51.84 1.092 1.357.75.666 1.381.872 1.577.971.197.101.312.086.426-.044.115-.13.491-.572.621-.766.13-.194.26-.164.441-.098.182.066 1.151.54 1.347.636.197.097.327.144.373.226.047.083.047.48-.097.885z" />
                    </svg>
                    Start Conversation
                  </a>
                  <p className="cta-sub">Connect with our Team</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA ── */}
        <div className="footer-cta">
          <Starfield />
          <div className="footer-cta-inner">
            <div className="footer-cta-logo">
              <img src="/logo.jpeg" alt="CaratSense" className="footer-cta-logo-img" />
              Caratsense
            </div>
            <h2 className="footer-cta-title">Let's build systems that actually fit your business.</h2>
            <p className="footer-cta-sub">
              Tell us where your business is breaking down. We'll research it, map it, and build the right solution. Contact us at <strong>vk@caratsense.in</strong> or call <strong>+91 93091 37416</strong>.
            </p>
            <div className="footer-cta-actions">
              <a href="#" className="btn btn-gold">Book a Discovery Call</a>
              <a href="#" className="btn btn-outline-dark">See What We Build</a>
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
                  <strong>SEE BEYOND.</strong> Custom operational platforms, designed around how Indian businesses actually work. Everything we build is designed around your actual workflow, not configured off a generic SaaS.
                </p>
                <div className="footer-socials">
                  {[
                    {
                      href: 'https://twitter.com/caratsense',
                      label: 'Twitter / X',
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.856L2.06 2.25h6.963l4.264 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        )
                    },
                    {
                      href: 'https://linkedin.com/company/caratsense',
                      label: 'LinkedIn',
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                        )
                    },
                    {
                      href: 'https://github.com/caratsense',
                      label: 'GitHub',
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        )
                    },
                    {
                      href: 'https://caratsense.in',
                      label: 'Website',
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                        )
                    },
                  ].map((s, i) => (
                    <a key={i} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                      <span className="fslink-inner">
                        <span className="fslink-top">{s.icon}<span className="fslink-text">{s.label}</span></span>
                        <span className="fslink-bot">{s.icon}<span className="fslink-text">{s.label}</span></span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
              {[
                { title: 'What We Build', links: ['Executive Dashboards', 'WhatsApp CRM', 'Inventory Intelligence', 'Order Bots', 'AI Chatbots'] },
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
              <span className="footer-copyright">© 2025 CaratSense. All rights reserved.</span>
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
