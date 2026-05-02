import React, { useEffect, useRef, useState } from 'react';
import HeroOrganicNetwork from './components/HeroOrganicNetwork';
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
        <img src="/logo.jpeg" alt="CaratSense" className="nav-logo-img" />
        Caratsense
      </a>
      <div className="nav-links">
        {['About', 'What We Build', 'Industries', 'Testimonials', 'Engagements', 'Insights'].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/\s+/g,'')}`} className="nav-link">{l}</a>
        ))}
      </div>
      <div className="nav-actions">
        <a href="#whatwebuild" className="btn btn-ghost">See Our Work</a>
        <a href="#engagements" className="btn btn-dark">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 8a5 5 0 1 1 10 0A5 5 0 0 1 3 8zm5-3.5a.5.5 0 0 0-1 0V8a.5.5 0 0 0 .146.354l2 2a.5.5 0 0 0 .708-.708L8 8.293V4.5z"/></svg>
          Work With Us
        </a>
      </div>
    </nav>
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <FloatingButtons theme={theme} setTheme={setTheme} />

      {/* Hero + all page content */}
      <div id="page-content" style={{ position: 'relative', zIndex: 1 }}>
        <Nav />
        <HeroOrganicNetwork />

        {/* ── ABOUT US ── */}
        <section className="section" id="about">
          <div className="section-inner">
            <div className="about-grid fade-in">
              <div className="about-content">
                <span className="section-label">Our Story</span>
                <h2 className="section-title">Bridging the Digital Gap for Indian Enterprises</h2>
                <p className="section-desc">
                  At Caratsense, we build custom operational platforms designed around how Indian businesses actually work. We believe that your software should adapt to your workflow, not the other way around.
                </p>
                <p className="section-desc">
                  From AI-powered data intelligence to seamless WhatsApp integrations, we turn your siloed data into powerful decision-making tools. Our goal is to empower owners to delegate and scale without losing control.
                </p>
              </div>
              <div className="about-visual">
                <div className="about-card">
                  <div className="about-card-icon">🇮🇳</div>
                  <div className="about-card-text">
                    <div className="about-card-title">India-First Design</div>
                    <div className="about-card-sub">Built for the unique complexities of the Indian B2B landscape.</div>
                  </div>
                </div>
                <div className="about-card">
                  <div className="about-card-icon">🧠</div>
                  <div className="about-card-text">
                    <div className="about-card-title">Pragmatic AI</div>
                    <div className="about-card-sub">Applying machine learning where it adds genuine operational value.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* ── LOGOS (Marquee) ── */}
      <div className="logos">
        <div className="logos-inner">
          <p className="logos-label">Built for businesses across every industry</p>
          <div className="marquee-container">
            <div className="marquee-content">
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

      {/* ── STATEMENT ── */}
      <section className="statement">
        <div className="statement-inner">
          <p className="statement-label">SEE BEYOND</p>
          <p className="statement-text">
            We turn your <strong>data into decision-making tools</strong> — built around<br />
            how your business actually runs, not how software thinks it should.
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" id="whatwebuild">
        <div className="section-inner">
          <div className="section-header fade-in">
            <p className="section-label">What We Build</p>
            <h2 className="section-title">Tailored systems for the way your business actually runs</h2>
            <p className="section-desc">Every engagement starts with understanding your operations — then we build exactly what's needed. No generic software, no bloated platforms.</p>
          </div>

          {/* Feature 1 */}
          <div className="feature-row fade-in">
            <div className="feature-text">
              <span className="feature-tag">Executive Dashboards</span>
              <h3 className="feature-heading">Real-time visibility into your business</h3>
              <p className="feature-body">
                We integrate directly with Tally, Busy, and other accounting systems used across India — pulling live data into clean dashboards so owners and executives stop relying on end-of-day reports and start making decisions in real time.
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
              <span className="feature-tag">CRM &amp; WhatsApp Integration</span>
              <h3 className="feature-heading">Your entire lead pipeline on WhatsApp</h3>
              <p className="feature-body">
                WhatsApp is how Indian B2B runs. We build CRM systems and lead management tools with WhatsApp at the centre — automated follow-ups, order bots, and broadcast sequences so your team never drops a lead again.
              </p>
              <a href="#" className="feature-link">
                Explore CRM features
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
              <span className="feature-tag">Inventory Intelligence</span>
              <h3 className="feature-heading">Know what's aging before it costs you</h3>
              <p className="feature-body">
                ML-powered aging alerts flag slow-moving stock before it becomes dead inventory. Demand forecasting tells you what to reorder and when — built specifically for jewellery, textiles, and building materials where working capital is everything.
              </p>
              <a href="#" className="feature-link">
                Explore inventory tools
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
              <span className="feature-tag">Delegation-Ready Systems</span>
              <h3 className="feature-heading">Built so the business runs without you</h3>
              <p className="feature-body">
                Most Indian family-run businesses are owner-dependent by design — and it's a bottleneck. We build systems that put the right information in front of the right people, so delegation becomes possible and the owner can finally step back.
              </p>
              <a href="#engagements" className="btn btn-dark" style={{ marginTop: 8, display: 'inline-flex' }}>
                Start a conversation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (Marquee) ── */}
      <section className="section bg-darker" id="testimonials">
        <div className="section-inner">
          <div className="section-header fade-in">
            <p className="section-label">Client Stories</p>
            <h2 className="section-title">Trusted by industry leaders</h2>
          </div>
        </div>
        <div className="marquee-container testimonial-marquee">
          <div className="marquee-content marquee-content--slow">
            {[
              {
                name: 'Rajesh Khanna',
                role: 'Founder, Khanna Jewellery',
                text: 'Caratsense AI transformed our wholesale operations. The WhatsApp CRM allowed us to delegate sales follow-ups without losing that personal touch.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_1_1777719076155.png'
              },
              {
                name: 'Priya Sharma',
                role: 'CEO, Urban Threads',
                text: 'They researched our warehouse workflow and built a system that flags slow-moving stock before it becomes a liability. A game-changer.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_2_1777719091657.png'
              },
              {
                name: 'Anil Mehta',
                role: 'Director, Mehta Manufacturing',
                text: 'They integrated our machine data directly with our billing software, giving us real-time visibility into production costs we never thought possible.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_3_1777719105843.png'
              },
              {
                name: 'Sameer Joshi',
                role: 'Owner, Joshi Specialty Chemicals',
                text: 'We now have a unified decisioning layer that pulls from our factory floor and sales team chats. Incredible efficiency and clarity.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_4_1777723611122.png'
              },
              {
                name: 'Anjali Desai',
                role: 'Director, Desai Building Materials',
                text: 'They found bottlenecks in our supply chain we didn\'t know existed. The dashboard they built is now our most used management tool.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_5_1777723629867.png'
              },
              {
                name: 'Karan Malhotra',
                role: 'Founder, Malhotra Aviation',
                text: 'Caratsense built us a native field app that actually works in low-connectivity areas. Truly bespoke engineering for Indian ops.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_6_1777723645322.png'
              }
            ].map((t, i) => (
              <div key={i} className="testimonial-card testimonial-card--marquee">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">
                    <img src={t.image} alt={t.name} />
                  </div>
                  <div className="testimonial-meta">
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
                <p className="testimonial-text">"{t.text}"</p>
              </div>
            ))}
            {/* Duplicate for infinite loop */}
            {[
              {
                name: 'Rajesh Khanna',
                role: 'Founder, Khanna Jewellery',
                text: 'Caratsense AI transformed our wholesale operations. The WhatsApp CRM allowed us to delegate sales follow-ups without losing that personal touch.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_1_1777719076155.png'
              },
              {
                name: 'Priya Sharma',
                role: 'CEO, Urban Threads',
                text: 'They researched our warehouse workflow and built a system that flags slow-moving stock before it becomes a liability. A game-changer.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_2_1777719091657.png'
              },
              {
                name: 'Anil Mehta',
                role: 'Director, Mehta Manufacturing',
                text: 'They integrated our machine data directly with our billing software, giving us real-time visibility into production costs we never thought possible.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_3_1777719105843.png'
              },
              {
                name: 'Sameer Joshi',
                role: 'Owner, Joshi Specialty Chemicals',
                text: 'We now have a unified decisioning layer that pulls from our factory floor and sales team chats. Incredible efficiency and clarity.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_4_1777723611122.png'
              },
              {
                name: 'Anjali Desai',
                role: 'Director, Desai Building Materials',
                text: 'They found bottlenecks in our supply chain we didn\'t know existed. The dashboard they built is now our most used management tool.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_5_1777723629867.png'
              },
              {
                name: 'Karan Malhotra',
                role: 'Founder, Malhotra Aviation',
                text: 'Caratsense built us a native field app that actually works in low-connectivity areas. Truly bespoke engineering for Indian ops.',
                image: '/Users/sahilshrivastava/.gemini/antigravity/brain/da71a15d-71da-41e6-b8d8-36fda6768322/testimonial_person_6_1777723645322.png'
              }
            ].map((t, i) => (
              <div key={`dup-${i}`} className="testimonial-card testimonial-card--marquee">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">
                    <img src={t.image} alt={t.name} />
                  </div>
                  <div className="testimonial-meta">
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
                <p className="testimonial-text">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── TRUST ── */}
      <section className="trust">
        <div className="trust-inner">
          <div className="fade-in">
            <p className="trust-label">How We Work</p>
            <h2 className="trust-title">From raw data to decisions that move your business forward</h2>
            <p className="trust-body">
              We follow a clear pipeline for every engagement: research the business, identify where operations are breaking down, brainstorm the right solution, then build a pitch package — scope doc, demo dashboard with your real data, architecture flowchart, and sprint timeline.
            </p>
            <a href="#engagements" className="btn btn-gold">Start your engagement</a>
          </div>
          <div className="fade-in fade-in-delay-1">
            <div className="trust-stats" style={{ marginBottom: 36 }}>
              {[
                { val: 'Fully Customized', label: 'Designed specifically for your actual workflow' },
                { val: 'India-Focused Pricing', label: 'Transparent structures built for growing enterprises' },
                { val: 'Scalable Architecture', label: 'Built to grow alongside your expanding operations' },
                { val: 'Workflow-First', label: 'We adapt to you, not the other way around' },
              ].map((s, i) => (
                <div key={i} className="trust-stat">
                  <div className="trust-stat-val">{s.val}</div>
                  <div className="trust-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="trust-visual">
              {[
                { icon: '🔍', title: 'Research-First', sub: 'We study your business before writing a line of code' },
                { icon: '📦', title: 'Pitch Package Included', sub: 'Scope doc, demo dashboard, architecture & sprint plan' },
                { icon: '🌐', title: 'Industry-Agnostic', sub: 'Retail, finance, logistics, healthcare — we build for any domain' },
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
      <section className="pricing" id="engagements">
        <div className="pricing-inner">
          <div className="pricing-header fade-in">
            <p className="section-label">Engagements</p>
            <h2 className="section-title" style={{ textAlign: 'center' }}>Start with a sprint.<br />Scale when it works.</h2>
          </div>
          <div className="pricing-grid fade-in fade-in-delay-1">
            {/* Discovery Sprint */}
            <div className="pricing-card">
              <div className="pricing-plan">Discovery Sprint</div>
              <div className="pricing-headline">Understand before you build.</div>
              <div className="pricing-tagline">For businesses unsure where to start.</div>
              <ul className="pricing-features">
                {[
                  'Deep-dive research into your operations',
                  'Bottleneck identification workshop',
                  'Solution architecture & recommendations',
                  'Demo dashboard built on your real data',
                  'Scope doc + sprint timeline',
                  'Architecture flowchart included',
                ].map((f, i) => (
                  <li key={i} className="pricing-feature">
                    <span className="pricing-feature-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#" className="btn btn-dark">Book a discovery call</a>
            </div>
            {/* Build Engagement */}
            <div className="pricing-card featured">
              <div className="pricing-plan">Full Build Engagement</div>
              <div className="pricing-headline" style={{ color: '#fff' }}>Custom-built for you.</div>
              <div className="pricing-tagline">For businesses ready to move.</div>
              <ul className="pricing-features">
                {[
                  'Everything in Discovery Sprint',
                  'Full product build in focused sprints',
                  'Tally / Busy / WhatsApp integration',
                  'ML & LLM layers where they add value',
                  'Team training & handover documentation',
                  'Post-launch support & iteration',
                  'Direct access to your build team',
                ].map((f, i) => (
                  <li key={i} className="pricing-feature">
                    <span className="pricing-feature-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://api.whatsapp.com/send/?phone=919309137416&text=Hi%2C+I+want+to+build+custom+operational+software+for+my+business&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Start the conversation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOGS ── */}
      <section className="blogs" id="insights">
        <div className="blogs-inner">
          <div className="blogs-header">
            <h2 className="section-title fade-in">From the field</h2>
            <a href="#" className="btn btn-ghost fade-in">View all case studies</a>
          </div>
          <div className="blogs-grid">
            {[
              {
                tag: 'Case Study',
                title: 'How a jewellery wholesaler cut owner-dependency by 60% with a WhatsApp CRM',
                gradient: 'linear-gradient(135deg, #0a0a14, #111128)',
                accent: '#2563eb',
              },
              {
                tag: 'Industry Insight',
                title: 'Why Tally-integrated dashboards are replacing spreadsheet reporting in Indian SMBs',
                gradient: 'linear-gradient(135deg, #140a0a, #281111)',
                accent: '#dc2626',
              },
              {
                tag: 'Product',
                title: 'Building an inventory aging alert system for a textile distributor — from research to sprint',
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
                {['𝕏', 'in', 'gh', '▷'].map((s, i) => (
                  <a key={i} href="#" className="footer-social-link">{s}</a>
                ))}
              </div>
            </div>
            {[
              { title: 'What We Build', links: ['Executive Dashboards', 'WhatsApp CRM', 'Inventory Intelligence', 'Order Bots', 'AI Chatbots'] },
              { title: 'Industries', links: ['Jewellery', 'Textiles', 'Building Materials', 'Manufacturing', 'Retail'] },
              { title: 'Resources', links: ['Blog', 'Case Studies', 'How We Work', 'Press', 'Brand Kit'] },
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
