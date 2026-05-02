import React, { useEffect, useRef, useState } from 'react';

// ── Constants ──────────────────────────────────────────────────
const CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@11.4.0/icons/';

const FLOAT_ICONS = [
  'n8n','python','openai','supabase','claude','databricks','slack',
  'gmail','amazonaws','salesforce','quickbooks','googlesheets','jira',
  'elasticsearch','react','nodedotjs','docker','kubernetes','postgresql',
  'redis','mongodb','stripe','github','googlecloud','flutter','grafana',
  'notion','whatsapp','tensorflow','figma','shopify','airtable',
];



const OUTER_NODES = [
  { id: 'industry', label: 'Industry Operating Systems',icon: 'linux',      color: '#a78bfa', angle: 270 },
  { id: 'aiml',     label: 'AI & ML Modules',           icon: 'openai',     color: '#D4AF37', angle: 45  },
  { id: 'whatsapp', label: 'WhatsApp Business Stack',   icon: 'whatsapp',   color: '#25D366', angle: 0   },
  { id: 'dashbi',   label: 'Dashboards & BI',           icon: 'grafana',    color: '#60a5fa', angle: 315 },
  { id: 'integ',    label: 'Integrations',              icon: 'n8n',        color: '#f472b6', angle: 90  },
  { id: 'mobile',   label: 'Mobile Applications',       icon: 'flutter',    color: '#fb923c', angle: 135 },
  { id: 'dataint',  label: 'Data Intelligence Platforms',icon: 'postgresql', color: '#4ade80', angle: 180 },
  { id: 'scope',    label: 'Scope & Audit Work',        icon: 'notion',     color: '#38bdf8', angle: 225 },
];

// Variable-depth trees — some deep, some shallow, some leaves
const NODE_TREES = {
  industry: [
    { id: 'orders', label: 'Orders', icon: 'linux', children: [
      { id: 'inventory', label: 'Inventory', icon: 'linux', children: [
        { id: 'billing', label: 'Billing', icon: 'linux', children: [
          { id: 'customers', label: 'Customers', icon: 'linux' }
        ]}
      ]}
    ]},
    { id: 'fieldops', label: 'Field Ops', icon: 'linux', children: [
      { id: 'reporting', label: 'Reporting', icon: 'linux' }
    ]}
  ],
  aiml: [
    { id: 'predictive', label: 'Predictive Analytics', icon: 'openai', children: [
      { id: 'forecasting', label: 'Forecasting', icon: 'openai' }
    ]},
    { id: 'cv', label: 'Computer Vision', icon: 'openai', children: [
      { id: 'anomaly', label: 'Anomaly Detection', icon: 'openai' }
    ]},
    { id: 'nlp', label: 'NLP', icon: 'openai' }
  ],
  whatsapp: [
    { id: 'campaigns', label: 'Managed Campaigns', icon: 'whatsapp', children: [
      { id: 'drip', label: 'Drip Flows', icon: 'whatsapp', children: [
        { id: 'ordercap', label: 'Order Capture', icon: 'whatsapp' }
      ]}
    ]},
    { id: 'supportbot', label: 'Support Bots', icon: 'whatsapp', children: [
      { id: 'paylinks', label: 'Payment Links', icon: 'whatsapp', children: [
        { id: 'broadcast', label: 'Broadcast Intelligence', icon: 'whatsapp' }
      ]}
    ]}
  ],
  dashbi: [
    { id: 'liveops', label: 'Live Ops Dashboards', icon: 'notion', children: [
      { id: 'salesintel', label: 'Sales Intelligence', icon: 'notion', children: [
        { id: 'distperf', label: 'Distributor Performance', icon: 'notion', children: [
          { id: 'ownerkpi', label: 'Owner-Level KPI Rollups', icon: 'notion' }
        ]}
      ]}
    ]}
  ],
  integ: [
    { id: 'tally', label: 'Tally', icon: 'figma' },
    { id: 'zoho', label: 'Zoho', icon: 'figma', children: [
      { id: 'ecommerce', label: 'E-commerce Backends', icon: 'figma' },
      { id: 'pg', label: 'Payment Gateways', icon: 'figma' }
    ]},
    { id: 'iot', label: 'IoT Sensors', icon: 'figma', children: [
      { id: 'bimcad', label: 'BIM/CAD', icon: 'figma' },
      { id: 'api', label: 'Partner APIs', icon: 'figma' }
    ]}
  ],
  mobile: [
    { id: 'fieldteams', label: 'Field Teams', icon: 'shopify', children: [
      { id: 'android', label: 'Native Android', icon: 'shopify' },
      { id: 'ios', label: 'Native iOS', icon: 'shopify' }
    ]},
    { id: 'salesreps', label: 'Sales Reps', icon: 'shopify', children: [
      { id: 'distributors', label: 'Distributors', icon: 'shopify', children: [
        { id: 'custapp', label: 'Customers', icon: 'shopify' }
      ]}
    ]}
  ],
  dataint: [
    { id: 'tallydata', label: 'Tally', icon: 'airtable', children: [
      { id: 'sheets', label: 'Sheets', icon: 'airtable' }
    ]},
    { id: 'crmdata', label: 'CRM', icon: 'airtable', children: [
      { id: 'whatsappdata', label: 'WhatsApp', icon: 'airtable' }
    ]},
    { id: 'machines', label: 'Machines', icon: 'airtable' }
  ],
  scope: [
    { id: 'audits', label: 'Operational Audits', icon: 'tensorflow', children: [
      { id: 'bottleneck', label: 'Bottleneck Mapping', icon: 'tensorflow', children: [
        { id: 'scopedocs', label: 'Scope Documents', icon: 'tensorflow', children: [
          { id: 'arch', label: 'Architecture Flowcharts', icon: 'tensorflow', children: [
            { id: 'dashdemos', label: 'Dashboard Demos', icon: 'tensorflow' }
          ]}
        ]}
      ]}
    ]}
  ]
};

// ── Math helpers ───────────────────────────────────────────────
const lerp   = (a, b, t) => a + (b - a) * t;
const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
const easeIO = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
const easeO  = t => 1 - Math.pow(1 - t, 3);
const polar  = (cx, cy, r, deg) => {
  const a = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};



// ── Main component ─────────────────────────────────────────────
const HeroOrganicNetwork = () => {
  const wrapperRef  = useRef(null);
  const canvasRef   = useRef(null);
  const iconRefs    = useRef([]);
  const progressRef = useRef(0);
  const particlesRef= useRef([]);
  const [pinnedId, setPinnedId]   = useState(null);
  const [hovered, setHovered]     = useState(null);
  
  const pinnedRef                 = useRef(null);
  const hoveredRef                = useRef(null);
  const expansionAnimRef = useRef({}); // { nodeId: 0..1 }
  const [phase, setPhase]         = useState(0);
  const [nodePositions, setNodePositions] = useState([]);

  // Init particles (Grid distribution to prevent clumping)
  useEffect(() => {
    const W = window.innerWidth, H = window.innerHeight;
    const cols = Math.ceil(Math.sqrt(FLOAT_ICONS.length));
    const rows = Math.ceil(FLOAT_ICONS.length / cols);
    const cellW = (W - 160) / cols;
    const cellH = (H - 160) / rows;

    particlesRef.current = FLOAT_ICONS.map((icon, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        icon,
        homeX: 80 + col * cellW + Math.random() * cellW,
        homeY: 80 + row * cellH + Math.random() * cellH,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      };
    });
  }, []);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => {
      const w = wrapperRef.current;
      if (!w) return;
      const total = w.scrollHeight - window.innerHeight;
      progressRef.current = total > 0 ? clamp(-w.getBoundingClientRect().top / total, 0, 1) : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Main RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, ts0 = 0;

    const resize = () => { 
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr; 
      canvas.height = canvas.offsetHeight * dpr; 
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const t = ts / 1000;
      // Dimensions in logical CSS pixels
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const cx = W / 2, cy = H / 2;
      const p = progressRef.current;

      ctx.clearRect(0, 0, W, H);

      // Adjusted ranges for smoother, less boxy transitions
      const C0 = 0.10, C1 = 0.45;  // converge range (particles inward)
      const E0 = 0.45, E1 = 0.85;  // expand range (bonds outward)

      const converge = easeIO(clamp((p - C0) / (C1 - C0), 0, 1));
      const expandT  = easeO(clamp((p - E0) / (E1 - E0), 0, 1));

      const newPhase = p < C0 ? 0 : p < C1 ? 1 : p < E0 ? 2 : 3;
      setPhase(newPhase);

      const HEX_R = Math.min(W, H) * 0.14;

      // ── Particles ─────────────────────────────────────────────
      particlesRef.current.forEach((pt, i) => {
        // Brownian drift of homeX/homeY
        pt.vx += (Math.random() - 0.5) * 0.05;
        pt.vy += (Math.random() - 0.5) * 0.05;
        pt.vx  = clamp(pt.vx * 0.97, -1.2, 1.2);
        pt.vy  = clamp(pt.vy * 0.97, -1.2, 1.2);
        pt.homeX = clamp(pt.homeX + pt.vx, 80, W - 80);
        pt.homeY = clamp(pt.homeY + pt.vy, 80, H - 80);

        // Display = lerp home→center by converge
        const dx = lerp(pt.homeX, cx, converge);
        const dy = lerp(pt.homeY, cy, converge);

        const opacity = converge > 0.75
          ? (1 - (converge - 0.75) / 0.25) * 0.65
          : (0.65 - converge * 0.1);

        const el = iconRefs.current[i];
        if (el) {
          el.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
          el.style.opacity   = Math.max(0, opacity).toFixed(3);
        }
      });

      // ── Octagon ───────────────────────────────────────────────
      const hexAlpha = converge > 0.40 ? easeO((converge - 0.40) / 0.60) : 0;
      if (hexAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = hexAlpha;

        // Organic spider edges and concentric webs
        for (let r = HEX_R; r > 10; r -= HEX_R * 0.35) {
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a1 = i * 45 + 22.5;
            const a2 = (i + 1) * 45 + 22.5;
            const pt1 = polar(cx, cy, r, a1);
            const pt2 = polar(cx, cy, r, a2);
            if (i === 0) ctx.moveTo(pt1.x, pt1.y);
            
            // Inward curving spider edge
            const midA = (a1 + a2) / 2;
            const cp = polar(cx, cy, r * 0.88, midA);
            ctx.quadraticCurveTo(cp.x, cp.y, pt2.x, pt2.y);
          }
          ctx.closePath();
          
          if (r === HEX_R) {
            ctx.fillStyle = 'rgba(7,7,18,0.93)';
            ctx.fill();
            ctx.shadowColor = 'rgba(212,175,55,0.55)';
            ctx.shadowBlur  = 22 + 7 * Math.sin(t * 1.6);
            ctx.strokeStyle = `rgba(212,175,55,${0.65 + 0.3 * Math.sin(t * 1.1)})`;
            ctx.lineWidth   = 1.6;
          } else {
            ctx.strokeStyle = `rgba(212,175,55,${hexAlpha * (r / HEX_R * 0.45)})`;
            ctx.lineWidth   = 1;
            ctx.shadowBlur  = 0;
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Center Text with improved typography
        const textProg = easeO(clamp((converge - 0.6) / 0.4, 0, 1));
        if (textProg > 0) {
          ctx.globalAlpha = hexAlpha * textProg;
          
          // Subtle glow behind text
          const glowGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, HEX_R * 0.6);
          glowGrd.addColorStop(0, 'rgba(212,175,55,0.15)');
          glowGrd.addColorStop(1, 'rgba(212,175,55,0)');
          ctx.beginPath(); ctx.arc(cx, cy, HEX_R * 0.6, 0, Math.PI*2);
          ctx.fillStyle = glowGrd; ctx.fill();

          ctx.textAlign = 'center'; 
          ctx.textBaseline = 'middle';
          const scale = 1;
          
          ctx.font = `600 ${22 * scale}px 'Inter', sans-serif`;
          ctx.fillStyle = `rgba(212,175,55,${hexAlpha * textProg})`;
          ctx.fillText("What we", cx, cy - 8 * scale);
          
          ctx.font = `bold ${32 * scale}px 'Inter', sans-serif`;
          ctx.fillText("PROVIDE", cx, cy + 28 * scale);
        }

        ctx.restore();
      }

      // Animate expansions: only one active at a time
      const activeNodeId = hoveredRef.current || pinnedRef.current;
      OUTER_NODES.forEach(n => {
        if (expansionAnimRef.current[n.id] === undefined) expansionAnimRef.current[n.id] = 0;
        
        const isTarget = activeNodeId === n.id;
        const target = isTarget ? 1 : 0;
        let curr = expansionAnimRef.current[n.id];
        curr += (target - curr) * 0.12;
        if (Math.abs(target - curr) < 0.005) curr = target;
        expansionAnimRef.current[n.id] = curr;
      });

      // ── Network bonds & pulsing dots ─────────────────────────
      if (expandT > 0) {
        // Constrain NDIST: shortened by ~20% as requested
        const NDIST = Math.min(W * 0.22, H * 0.25);
        const positions = [];
        
        // Track global activity for fading inactive bonds
        const anyActive = !!activeNodeId;

        OUTER_NODES.forEach((node, idx) => {
          const nodeProg = easeO(clamp((expandT - idx * 0.055) / 0.65, 0, 1));
          if (nodeProg <= 0) return;

          const np = polar(cx, cy, NDIST * nodeProg, node.angle);
          const ep = polar(cx, cy, HEX_R, node.angle);
          positions.push({ ...node, px: np.x, py: np.y, visible: nodeProg > 0.15, depth: 0, opacity: 1, scale: 1 });

          const isThisActive = activeNodeId === node.id;
          let bondAlphaScale = 1;
          if (anyActive) {
            bondAlphaScale = isThisActive ? 1 : 0.15;
          }

          // Bond line
          ctx.save();
          ctx.globalAlpha = nodeProg * 0.75 * bondAlphaScale;
          const grd = ctx.createLinearGradient(ep.x, ep.y, np.x, np.y);
          grd.addColorStop(0, 'rgba(212,175,55,0.5)');
          grd.addColorStop(1, node.color + '88');
          ctx.beginPath(); ctx.moveTo(ep.x, ep.y); ctx.lineTo(np.x, np.y);
          ctx.strokeStyle = grd; ctx.lineWidth = 1.1;
          ctx.shadowColor = node.color; ctx.shadowBlur = 5;
          ctx.stroke(); ctx.shadowBlur = 0;

          // Pulsing bead along bond
          if (!anyActive || isThisActive) {
            const bead = ((t * 0.55 + idx * 0.18) % 1);
            const bx = lerp(ep.x, np.x, bead), by = lerp(ep.y, np.y, bead);
            ctx.beginPath(); ctx.arc(bx, by, 2.4, 0, Math.PI*2);
            ctx.fillStyle = node.color; ctx.fill();
          }
          ctx.restore();

          // Draw expanded spider-web for this node
          const prog = expansionAnimRef.current[node.id] || 0;
          if (prog > 0.01) {
            drawSpiderWeb(ctx, np, node, t, 0, positions, prog, 1, expansionAnimRef);
          }
        });

        setNodePositions(positions);
      } else {
        setNodePositions([]);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const togglePinned = (id) => {
    let next = null;
    if (pinnedRef.current !== id) next = id;
    pinnedRef.current = next;
    setPinnedId(next);
  };

  const heroVisible = phase === 0;

  return (
    <div ref={wrapperRef} className="hon-wrapper">
      <div className="hon-sticky">
        {/* Floating icon particles */}
        <div className="hon-particles-layer">
          {FLOAT_ICONS.map((icon, i) => (
            <div key={icon + i} ref={el => iconRefs.current[i] = el} className="hon-particle">
              <img src={`${CDN}${icon}.svg`} alt="" className="hon-particle-img" />
            </div>
          ))}
        </div>

        {/* Canvas: hexagon, radar, bonds, spider webs */}
        <canvas ref={canvasRef} className="hon-canvas" />

        {/* SVG overlay: clickable nodes */}
        {nodePositions.length > 0 && (
          <svg className="hon-svg-overlay">
            <defs>
              <filter id="glow-node" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {nodePositions.filter(n => n.visible).map(node => {
              const isActive = pinnedId === node.id || hovered === node.id;
              const isPinned = pinnedId === node.id;
              const isOuter = node.depth === 0;
              const activeNodeId = hovered || pinnedId;
              const isOtherActive = isOuter && activeNodeId && activeNodeId !== node.id;
              
              const scale = isOtherActive ? 0.65 : (node.scale || 1);
              const opacity = isOtherActive ? 0.35 : (node.opacity || 1);

              return (
                <NodeCircle
                  key={node.id}
                  node={{ ...node, scale, opacity }}
                  isExpanded={isActive}
                  isPinned={isPinned}
                  onToggle={() => {
                    if (node.depth === 0) togglePinned(node.id);
                  }}
                  onEnter={() => {
                    if (node.depth === 0) {
                      hoveredRef.current = node.id;
                      setHovered(node.id);
                    }
                  }}
                  onLeave={() => {
                    if (node.depth === 0 && hoveredRef.current === node.id) {
                      hoveredRef.current = null;
                      setHovered(null);
                    }
                  }}
                />
              );
            })}
          </svg>
        )}

        {/* Hero copy — phase 0 */}
        <div className="hon-hero-text" style={{ opacity: heroVisible ? 1 : 0, pointerEvents: heroVisible ? 'auto' : 'none' }}>
          <div className="hero-badge" style={{ fontWeight: 'bold', letterSpacing: '1px' }}>
            <span className="dot" />
            SEE BEYOND
          </div>
          <h1 className="hero-title">
            We accelerate your<br />
            <em>business towards</em><br />
            growth
          </h1>
          <p className="hero-subtitle">
            CaratSense is a consultative AI and software studio. We go deep into your
            operations, find where things are breaking down, and build tailored tech to fix it.
          </p>
          <div className="hero-actions">
            <a href="#engagements" className="btn btn-dark">
              <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 1a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm-.5 4a.5.5 0 0 1 1 0v3.293l1.854 1.853a.5.5 0 0 1-.708.708L7.5 9.707V6z"/>
              </svg>
              Book a Discovery Call
            </a>
            <a href="#whatwebuild" className="btn btn-ghost">See what we build</a>
          </div>
        </div>

        {/* Phase hints */}
        {phase === 2 && (
          <div className="hon-phase-label"><span>Core Capabilities</span></div>
        )}
        {phase >= 3 && (
          <div className="hon-phase-label hon-phase-label--bottom">
            <span>Click any node to explore our stack</span>
          </div>
        )}
        {phase === 0 && <div className="scroll-indicator"><div className="scroll-line"/></div>}
      </div>
    </div>
  );
};

// ── Spider web canvas draw (called inside RAF) ─────────────────
function drawSpiderWeb(ctx, origin, parentNode, t, depth, svgNodes, expandProg, parentAlpha, expansionAnimRef) {
  const children = depth === 0 ? NODE_TREES[parentNode.id] : parentNode.children;
  if (!children || children.length === 0) return;

  const angleBase = parentNode.angle;
  const spreadMax = 240 * Math.pow(0.85, depth); // Increased to prevent clutter
  const spread    = Math.min(95 * Math.pow(0.85, depth), spreadMax / children.length);
  const startAng  = angleBase - spread * (children.length - 1) / 2;
  
  // Base radius increased to push children further out, giving more breathing room
  const baseR = 105 * Math.pow(0.85, depth);
  const radii = [baseR, baseR * 0.95, baseR * 1.05, baseR * 0.9, baseR * 1.1];

  children.forEach((child, i) => {
    const ang = startAng + i * spread;
    const r   = radii[i % radii.length] * expandProg;
    const cp  = polar(origin.x, origin.y, r, ang);

    // Bezier curve (organic)
    const mx = (origin.x + cp.x) / 2 + Math.sin(t * 0.8 + i + depth) * (8 - depth);
    const my = (origin.y + cp.y) / 2 + Math.cos(t * 0.8 + i + depth) * (8 - depth);

    ctx.save();
    ctx.globalAlpha = Math.max(0.1, 0.6 - depth * 0.1) * expandProg * parentAlpha;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.quadraticCurveTo(mx, my, cp.x, cp.y);
    ctx.strokeStyle = parentNode.color + 'aa';
    ctx.lineWidth = Math.max(0.4, 0.9 - depth * 0.15);
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Push to svgNodes array instead of canvas drawing
    if (expandProg > 0.05) {
      svgNodes.push({
        ...child,
        px: cp.x,
        py: cp.y,
        color: parentNode.color,
        angle: ang,
        depth: depth + 1,
        opacity: expandProg * parentAlpha,
        scale: Math.min(1, expandProg * 1.2),
        visible: true
      });
    }

    // Grandchildren - animate their expansion if clicked
    if (child.children && child.children.length > 0 && depth < 4) {
      const childProg = expansionAnimRef.current[child.id] || 0;
      if (childProg > 0.01) {
        drawSpiderWeb(ctx, cp, { ...parentNode, id: child.id, angle: ang, children: child.children }, t, depth + 1, svgNodes, childProg, expandProg * parentAlpha, expansionAnimRef);
      }
    }
  });
}

// ── SVG Node Circle ────────────────────────────────────────────
const NodeCircle = ({ node, isExpanded, isPinned, onToggle, onEnter, onLeave }) => {
  const isOuter = node.depth === 0;
  const R = isOuter ? (isExpanded ? 32 : 28) : 24;
  const iconSize = isOuter ? 22 : 16;
  const hasChildren = isOuter ? (NODE_TREES[node.id] || []).length > 0 : (node.children && node.children.length > 0);
  
  const opacity = node.opacity !== undefined ? node.opacity : 1;
  const scale = node.scale !== undefined ? node.scale : 1;

  // Add a thicker border or glow if pinned
  const strokeColor = isPinned ? node.color : "rgba(255,255,255,0.15)";
  const strokeWidth = isPinned ? 2 : 1;

  return (
    <g onClick={(e) => { e.stopPropagation(); onToggle(); }}
       onMouseEnter={onEnter}
       onMouseLeave={onLeave}
       style={{ 
         cursor: hasChildren ? 'pointer' : 'default', 
         opacity, 
         transform: `scale(${scale})`, 
         transformOrigin: `${node.px}px ${node.py}px`,
         transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
       }} 
       filter={isOuter ? "url(#glow-node)" : ""}>
      
      {/* Outer glow ring when expanded */}
      {isExpanded && (
        <circle cx={node.px} cy={node.py} r={R + 8} fill="none"
          stroke={node.color + '30'} strokeWidth={isOuter ? 6 : 3} />
      )}

      {/* Main circle */}
      <circle cx={node.px} cy={node.py} r={R}
        fill="rgba(7,7,18,0.94)"
        stroke={node.color}
        strokeWidth={isExpanded ? 2.2 : 1.4}
      />

      {/* Icon image */}
      {node.icon && (
        <image
          href={`${CDN}${node.icon}.svg`}
          x={node.px - iconSize/2} y={node.py - iconSize/2 - (isOuter ? 3 : 2)}
          width={iconSize} height={iconSize}
          style={{ filter: `invert(1) sepia(1) saturate(0) brightness(2) hue-rotate(0deg)`, opacity: 0.85 }}
        />
      )}

      {/* Label below icon */}
      <text x={node.px} y={node.py + R + (isOuter ? 8 : 7)}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={isOuter ? "8.5" : "7.5"} 
        fontFamily="Inter,sans-serif" fontWeight={isOuter ? "700" : "500"}
        fill={node.color}>
        {node.label.split(' ').map((w, i) => (
          <tspan key={i} x={node.px} dy={i === 0 ? 0 : 8}>{w}</tspan>
        ))}
      </text>

      {/* Expand indicator */}
      {hasChildren && !isExpanded && (
        <text x={node.px + R - (isOuter ? 5 : 4)} y={node.py - R + (isOuter ? 5 : 4)}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={isOuter ? "9" : "7"} fill={node.color} opacity="0.9">+</text>
      )}
    </g>
  );
};

export default HeroOrganicNetwork;
