import React, { useEffect, useRef } from 'react';
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

// ── Cursor-reactive colored dot field + glow ───────────────────
// Dots colored by proximity: gold at ~0–80px, blue at ~80–200px,
// neutral gray beyond. A smooth lerped radial gradient spotlight
// trails the cursor, mimicking the antigravity.google effect.

const CursorDotField = () => {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const glowRef   = useRef(null);
  // Lerped position for the smooth glow div
  const lerpRef   = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowEl = glowRef.current;
    if (!canvas || !glowEl) return;
    const ctx = canvas.getContext('2d');
    let animId;

    // ── Mouse tracking ──────────────────────────────────────────
    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Grid constants ──────────────────────────────────────────
    const SPACING      = 36;
    const RADIUS       = 1.5;
    const INFLUENCE    = 160;   // repulsion radius
    const COLOR_INNER  = 80;    // gold zone radius
    const COLOR_MID    = 200;   // blue zone radius
    const MAX_PUSH     = 30;
    const RETURN_SPEED = 0.055;
    const DAMPING      = 0.70;

    let dots = [];

    const buildGrid = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.ceil(canvas.width  / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;
      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({ ox: c * SPACING, oy: r * SPACING,
                      x:  c * SPACING,  y: r * SPACING,
                      vx: 0, vy: 0 });
        }
      }
    };

    buildGrid();
    window.addEventListener('resize', buildGrid);

    // ── Color helper: lerp between two RGBA arrays ──────────────
    const lerpColor = (a, b, t) =>
      a.map((v, i) => v + (b[i] - v) * t);

    // Neutral, blue, gold colours as [r,g,b,a]
    const COL_NEUTRAL = [100, 120, 160, 0.18];
    const COL_BLUE    = [ 70, 120, 220, 0.55];
    const COL_GOLD    = [212, 175,  55, 0.75];

    // ── Main animation loop ─────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Smooth lerp of the glow div toward cursor
      const LERP = 0.08;
      lerpRef.current.x += (mx - lerpRef.current.x) * LERP;
      lerpRef.current.y += (my - lerpRef.current.y) * LERP;
      const gx = lerpRef.current.x;
      const gy = lerpRef.current.y;

      // Update glow div center via CSS custom properties
      glowEl.style.setProperty('--gx', `${gx}px`);
      glowEl.style.setProperty('--gy', `${gy}px`);
      // Fade in once cursor has moved
      if (gx > -9000) glowEl.style.opacity = '1';

      // Draw dots
      dots.forEach(d => {
        // Spring to origin
        d.vx += (d.ox - d.x) * RETURN_SPEED;
        d.vy += (d.oy - d.y) * RETURN_SPEED;
        d.vx *= DAMPING;
        d.vy *= DAMPING;

        const cdx  = d.x - mx;
        const cdy  = d.y - my;
        const dist = Math.sqrt(cdx * cdx + cdy * cdy);

        // Repulsion
        if (dist < INFLUENCE && dist > 0) {
          const force = (1 - dist / INFLUENCE);
          const push  = force * MAX_PUSH;
          d.vx += (cdx / dist) * push * 0.20;
          d.vy += (cdy / dist) * push * 0.20;
        }

        d.x += d.vx;
        d.y += d.vy;

        // Color by distance
        let col;
        if (dist < COLOR_INNER) {
          const t = dist / COLOR_INNER;
          col = lerpColor(COL_GOLD, COL_BLUE, t);
        } else if (dist < COLOR_MID) {
          const t = (dist - COLOR_INNER) / (COLOR_MID - COLOR_INNER);
          col = lerpColor(COL_BLUE, COL_NEUTRAL, t);
        } else {
          col = COL_NEUTRAL;
        }

        const r = Math.round(col[0]);
        const g = Math.round(col[1]);
        const b = Math.round(col[2]);
        const a = col[3];

        ctx.beginPath();
        ctx.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', buildGrid);
    };
  }, []);

  return (
    <>
      {/* Colored dot canvas */}
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

      {/* Static edge aura — soft blue inner glow around viewport edges */}
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

// ── Mock UI Components (Interactive) ──────────────────────────
import { useState } from 'react';

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

// ── Nav ────────────────────────────────────────────────────────
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

  return (
    <>
      <CursorDotField />
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
    </>
  );
}
