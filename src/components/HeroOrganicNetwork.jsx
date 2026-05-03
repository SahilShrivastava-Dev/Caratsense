import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';

const CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@11.4.0/icons/';

const FLOAT_ICONS = [
  'n8n','python','openai','supabase','claude','databricks','slack',
  'gmail','amazonaws','salesforce','quickbooks','googlesheets','jira',
  'elasticsearch','react','nodedotjs','docker','kubernetes','postgresql',
  'redis','mongodb','stripe','github','googlecloud','flutter','grafana',
  'notion','whatsapp','tensorflow','figma','shopify','airtable',
];

const NODE_DETAILS = {
  industry: "Custom Linux distributions, tailored OS deployments, and secure field-ready hardware integrations built for the harshest industrial environments.",
  aiml: "We deploy custom LLMs, computer vision, and predictive analytics pipelines fine-tuned exclusively on your proprietary data streams.",
  whatsapp: "Automated WhatsApp flows, smart drip campaigns, and intelligent support bots for frictionless customer engagement.",
  dashbi: "Real-time live-ops dashboards and executive BI tools that pull data from the tangled web to let you monitor KPIs at a glance.",
  integ: "Seamlessly connect disparate systems—from Zoho and Tally to custom IoT sensors and legacy APIs, tying the web together.",
  mobile: "Lightning-fast native and cross-platform mobile applications built for your on-the-ground field teams and end consumers.",
  dataint: "Robust data pipelines turning messy CRM, spreadsheet, and raw machine data into a single, structured source of truth.",
  scope: "Deep operational audits to find bottlenecks and architect scalable tech solutions before a single line of code is written."
};

const PLANETS_DATA = [
  { id: 'industry', label: 'Industry OS', color: '#a78bfa', distance: 6, speed: 0.15, size: 0.6, icon: 'linux' },
  { id: 'aiml',     label: 'AI & ML',     color: '#D4AF37', distance: 9, speed: 0.12, size: 0.8, icon: 'openai' },
  { id: 'whatsapp', label: 'WhatsApp Stack', color: '#25D366', distance: 12, speed: 0.1, size: 0.5, icon: 'whatsapp' },
  { id: 'dashbi',   label: 'Dashboards & BI', color: '#60a5fa', distance: 15, speed: 0.08, size: 0.7, icon: 'grafana' },
  { id: 'integ',    label: 'Integrations', color: '#f472b6', distance: 18, speed: 0.06, size: 0.5, icon: 'n8n' },
  { id: 'mobile',   label: 'Mobile Apps', color: '#fb923c', distance: 21, speed: 0.05, size: 0.6, icon: 'flutter' },
  { id: 'dataint',  label: 'Data Intelligence', color: '#4ade80', distance: 24, speed: 0.04, size: 0.8, icon: 'postgresql' },
  { id: 'scope',    label: 'Scope & Audit', color: '#38bdf8', distance: 27, speed: 0.03, size: 0.5, icon: 'notion' },
];

function OrbitRing({ radius }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.04, radius + 0.04, 64]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.06} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Planet({ data, isSelected, onClick, registerRef, progress }) {
  const ref = useRef();
  const randomOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const currentSpeed = isSelected ? data.speed * 0.05 : data.speed;
    ref.current.position.x = Math.cos(t * currentSpeed + randomOffset) * data.distance;
    ref.current.position.z = Math.sin(t * currentSpeed + randomOffset) * data.distance;
    ref.current.rotation.y += isSelected ? 0.01 : 0.005;
  });

  return (
    <group ref={(node) => { ref.current = node; registerRef(data.id, node); }}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(data.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[data.size, 64, 64]} />
        <meshStandardMaterial 
          color={data.color} 
          roughness={0.3} 
          metalness={0.7}
          emissive={data.color}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
        />
      </mesh>
      
      <Html position={[0, data.size + 0.8, 0]} center style={{ pointerEvents: 'none', transition: 'opacity 0.3s', opacity: isSelected ? 0 : (progress > 0.4 ? 1 : 0) }}>
        <div style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          background: 'rgba(0,0,0,0.6)',
          padding: '4px 10px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)',
          whiteSpace: 'nowrap',
          border: `1px solid ${data.color}44`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <img src={`${CDN}${data.icon}.svg`} alt="" style={{ width: '12px', height: '12px', filter: 'brightness(0) invert(1)' }} />
          {data.label}
        </div>
      </Html>
    </group>
  );
}

function SolarSystem({ selectedId, onSelectPlanet, progress }) {
  const planetsRef = useRef({});
  const controlsRef = useRef();
  const groupRef = useRef();

  useFrame((state) => {
    // Control Scale of entire Solar System based on scroll progress
    // Progress 0 -> 0.4: scale = 0
    // Progress 0.4 -> 0.7: scale = 0 -> 1
    const targetScale = progress < 0.4 ? 0 : Math.min(1, (progress - 0.4) / 0.3);
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    const controls = controlsRef.current;
    if (!controls) return;

    if (selectedId && planetsRef.current[selectedId]) {
      const planet = planetsRef.current[selectedId];
      const targetPos = new THREE.Vector3();
      planet.getWorldPosition(targetPos);

      const cameraOffset = new THREE.Vector3(2, 0.5, 3);
      const desiredCameraPos = targetPos.clone().add(cameraOffset);

      state.camera.position.lerp(desiredCameraPos, 0.04);
      controls.target.lerp(targetPos, 0.04);
    } else {
      const defaultCameraPos = new THREE.Vector3(0, 20, 35);
      state.camera.position.lerp(defaultCameraPos, 0.03);
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.03);
    }
    controls.update();
  });

  return (
    <group ref={groupRef}>
      {/* enableZoom={false} prevents scrolling issues on the main page */}
      <OrbitControls 
        ref={controlsRef} 
        enablePan={false} 
        enableZoom={false} 
        maxDistance={60}
        minDistance={5}
      />
      
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={300} color="#ffedd5" distance={150} />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      
      <Html position={[0, 4, 0]} center style={{ pointerEvents: 'none', transition: 'opacity 0.3s', opacity: selectedId ? 0 : (progress > 0.4 ? 1 : 0) }}>
        <div style={{
          color: '#fbbf24', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Inter, sans-serif',
          background: 'rgba(0,0,0,0.6)', padding: '6px 16px', borderRadius: '8px', border: '1px solid #fbbf2466',
          whiteSpace: 'nowrap', backdropFilter: 'blur(4px)'
        }}>
          What we PROVIDE
        </div>
      </Html>

      {PLANETS_DATA.map((planet) => (
        <group key={planet.id}>
          <OrbitRing radius={planet.distance} />
          <Planet 
            data={planet} 
            isSelected={selectedId === planet.id}
            onClick={onSelectPlanet}
            registerRef={(id, ref) => { planetsRef.current[id] = ref; }}
            progress={progress}
          />
        </group>
      ))}

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const HeroOrganicNetwork = () => {
  const [selectedId, setSelectedId] = useState(null);
  const selectedPlanet = PLANETS_DATA.find(p => p.id === selectedId);

  const wrapperRef = useRef(null);
  const iconRefs = useRef([]);
  const particlesRef = useRef([]);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const isMobile = window.innerWidth < 768;

  // Initialize background HTML particles
  useEffect(() => {
    const W = window.innerWidth, H = window.innerHeight;
    const iconCount = isMobile ? 12 : FLOAT_ICONS.length;
    const icons = FLOAT_ICONS.slice(0, iconCount);
    const cols = Math.ceil(Math.sqrt(icons.length));
    const rows = Math.ceil(icons.length / cols);
    const cellW = (W - (isMobile ? 60 : 160)) / cols;
    const cellH = (H - (isMobile ? 60 : 160)) / rows;

    particlesRef.current = icons.map((icon, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        homeX: (isMobile ? 30 : 80) + col * cellW + Math.random() * cellW,
        homeY: (isMobile ? 30 : 80) + row * cellH + Math.random() * cellH,
        x: 0, y: 0,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      };
    });
  }, [isMobile]);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => {
      const w = wrapperRef.current;
      if (!w) return;
      const total = w.scrollHeight - window.innerHeight;
      const p = total > 0 ? clamp(-w.getBoundingClientRect().top / total, 0, 1) : 0;
      progressRef.current = p;
      setProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // RAF loop for animating HTML floating icons
  useEffect(() => {
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const W = window.innerWidth;
      const H = window.innerHeight;
      const cx = W / 2;
      const cy = H / 2;
      const p = progressRef.current;

      // Convergence logic: icons drift -> converge to center by p=0.4
      const convergeT = clamp(p / 0.4, 0, 1);
      const easeConverge = easeInOutCubic(convergeT);

      particlesRef.current.forEach((pt, i) => {
        // Brownian drift
        pt.vx += (Math.random() - 0.5) * 0.05;
        pt.vy += (Math.random() - 0.5) * 0.05;
        pt.vx = clamp(pt.vx * 0.97, -1.2, 1.2);
        pt.vy = clamp(pt.vy * 0.97, -1.2, 1.2);
        pt.homeX = clamp(pt.homeX + pt.vx, 40, W - 40);
        pt.homeY = clamp(pt.homeY + pt.vy, 40, H - 40);

        // Lerp to center
        pt.x = lerp(pt.homeX, cx, easeConverge);
        pt.y = lerp(pt.homeY, cy, easeConverge);

        const el = iconRefs.current[i];
        if (el) {
          el.style.transform = `translate(${pt.x}px,${pt.y}px) translate(-50%,-50%)`;
          // Fade out as they reach the center
          el.style.opacity = Math.max(0, 0.65 - (easeConverge * 0.65)).toFixed(3);
        }
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const heroVisible = progress < 0.2;
  const solarSystemUIActive = progress > 0.7;

  return (
    <div ref={wrapperRef} className="hon-wrapper" style={{ height: '250vh' }}>
      <div className="hon-sticky" style={{ height: '100vh', position: 'sticky', top: 0, overflow: 'hidden', background: '#050505' }}>
        
        {/* HTML Floating Icons (Phase 0 -> Phase 1) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          {(isMobile ? FLOAT_ICONS.slice(0, 12) : FLOAT_ICONS).map((icon, i) => (
            <div key={icon + i} ref={el => iconRefs.current[i] = el} style={{ position: 'absolute', top: 0, left: 0 }}>
              <img src={`${CDN}${icon}.svg`} alt="" style={{ width: '32px', height: '32px', filter: 'brightness(0) invert(1)' }} />
            </div>
          ))}
        </div>

        {/* Phase 0: Hero Copy */}
        <div className="hon-hero-text" style={{ 
          opacity: heroVisible ? 1 - (progress/0.2) : 0, 
          pointerEvents: heroVisible ? 'auto' : 'none',
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', zIndex: 2, transition: 'opacity 0.1s'
        }}>
          <div className="hero-badge" style={{ fontWeight: 'bold', letterSpacing: '1px' }}>
            <span className="dot" />
            SEE BEYOND
          </div>
          <h1 className="hero-title" style={{ fontSize: '4rem', color: '#fff', margin: '20px 0', lineHeight: 1.1 }}>
            We accelerate your<br />
            <em style={{ color: '#fbbf24', fontStyle: 'normal' }}>business towards</em><br />
            growth
          </h1>
          <p className="hero-subtitle" style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '30px' }}>
            CaratSense is a consultative AI and software studio. We go deep into your
            operations, find where things are breaking down, and build tailored tech to fix it.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a href="#engagements" className="btn btn-dark" style={{ background: '#fbbf24', color: '#000', padding: '12px 24px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold' }}>
              Book a Discovery Call
            </a>
          </div>
          <div className="scroll-indicator" style={{ marginTop: '40px' }}><div className="scroll-line" style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.2)', margin: '0 auto' }}/></div>
        </div>

        {/* 3D Canvas (Scales up during Phase 1 -> Phase 2) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
          <Canvas camera={{ position: [0, 20, 35], fov: 45 }}>
            <SolarSystem selectedId={selectedId} onSelectPlanet={setSelectedId} progress={progress} />
          </Canvas>
        </div>

        {/* Foreground UI Overlay (Phase 3) */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          pointerEvents: 'none', display: 'flex', flexDirection: 'column', padding: '40px', zIndex: 3 
        }}>
          
          {/* Intro text when nothing is selected */}
          <div style={{ 
            opacity: (solarSystemUIActive && !selectedId) ? 1 : 0, transition: 'opacity 0.5s', 
            maxWidth: '600px', marginTop: '10vh', marginLeft: '5vw'
          }}>
            <div className="hero-badge" style={{ fontWeight: 'bold', letterSpacing: '1px', marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
              <span style={{ width: '8px', height: '8px', background: '#fbbf24', borderRadius: '50%', marginRight: '8px' }} />
              EXPLORE
            </div>
            <h1 style={{ fontSize: '4rem', color: '#fff', margin: 0, lineHeight: 1.1, fontFamily: 'Inter, sans-serif' }}>
              We do <br/><span style={{ color: '#fbbf24' }}>crazy stuff</span>
            </h1>
            <p style={{ color: '#aaa', fontSize: '1.2rem', marginTop: '20px', fontFamily: 'Inter, sans-serif' }}>
              The central sun represents our core capability engine. The orbiting planets are our specialized domains. <strong style={{color: '#fff'}}>Click on any planet</strong> to dive deep into our universe of data and tech.
            </p>
          </div>

          {/* Planet Story UI */}
          <div style={{
            position: 'absolute', bottom: '10vh', left: '5vw', 
            opacity: selectedId ? 1 : 0, transition: 'opacity 0.5s', transform: selectedId ? 'translateY(0)' : 'translateY(20px)',
            maxWidth: '500px', background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)',
            padding: '40px', borderRadius: '24px', border: `1px solid ${selectedPlanet?.color || '#fff'}44`,
            pointerEvents: selectedId ? 'auto' : 'none',
            boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 40px ${selectedPlanet?.color || '#fff'}11`
          }}>
            {selectedPlanet && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '12px',
                    background: selectedPlanet.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <img 
                      src={`${CDN}${selectedPlanet.icon}.svg`} 
                      style={{ width: '32px', height: '32px', filter: 'brightness(0) invert(1)' }} 
                      alt="" 
                    />
                  </div>
                  <h2 style={{ color: selectedPlanet.color, fontSize: '2.5rem', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                    {selectedPlanet.label}
                  </h2>
                </div>
                
                <p style={{ color: '#fff', fontSize: '1.2rem', lineHeight: 1.6, margin: '0 0 32px 0', fontFamily: 'Inter, sans-serif' }}>
                  {NODE_DETAILS[selectedId]}
                </p>
                
                <button 
                  onClick={() => setSelectedId(null)}
                  style={{
                    background: 'none', border: `1px solid ${selectedPlanet.color}`,
                    color: '#fff', padding: '12px 24px', borderRadius: '30px', fontSize: '1rem', cursor: 'pointer',
                    transition: 'all 0.2s', fontWeight: 'bold', fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = selectedPlanet.color; e.currentTarget.style.color = '#000'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#fff'; }}
                >
                  ← Back to Solar System
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroOrganicNetwork;
