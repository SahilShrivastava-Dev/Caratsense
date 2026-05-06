import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Billboard, useTexture, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Folder, FileText, FileSpreadsheet, Database, HardDrive, Table } from 'lucide-react';

const CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@11.4.0/icons/';

const CUSTOM_ICONS = {
  folder: Folder,
  file: FileText,
  spreadsheet: FileSpreadsheet,
  database: Database,
  drive: HardDrive,
  table: Table
};

const FLOAT_ICONS = [
  'microsoftexcel', 'googlesheets', 'snowflake', 'databricks',
  'folder', 'file', 'spreadsheet', 'folder', 'file',
  'microsoftexcel', 'folder', 'file', 'spreadsheet', 'folder',
  'googlesheets', 'snowflake', 'folder', 'file', 'drive',
  'microsoftexcel', 'databricks', 'folder', 'file', 'database',
  'spreadsheet', 'folder', 'file', 'microsoftexcel', 'googlesheets',
  'folder', 'file', 'snowflake', 'databricks'
];

const NODE_DETAILS = {
  industry: "Advanced Time Series analysis to forecast demand, seasonal trends, and hardware sensor failures with 99% accuracy.",
  aiml: "Proprietary Sales Prediction engines that analyze historical patterns to optimize inventory and revenue growth.",
  whatsapp: "End-to-end SaaS Platform development, from high-performance backends to intuitive user interfaces and multi-tenant architectures.",
  dashbi: "Tailored Custom Model Configuration, fine-tuning neural networks and traditional ML models on your unique domain data.",
  integ: "Edge-ready Computer Vision modules for automated quality control, security monitoring, and object recognition.",
  mobile: "Scalable LLM Pipelines for document intelligence, automated customer support, and semantic search over your internal knowledge base.",
  dataint: "Building modern Data Lakehouses on Snowflake and Databricks to provide a single, structured source of truth for your entire organization.",
  scope: "Deep operational audits and strategic technical roadmaps to find bottlenecks and architect scalable tech solutions."
};

const PLANETS_DATA = [
  { id: 'industry', label: 'Time Series Prediction', mobileLabel: 'Time Series', color: '#a78bfa', distance: 5.0, speed: 0.15, size: 0.6, icon: 'pandas' },
  { id: 'aiml', label: 'Sales Prediction', mobileLabel: 'Sales Analysis', color: '#D4AF37', distance: 7.0, speed: 0.12, size: 0.8, icon: 'salesforce' },
  { id: 'whatsapp', label: 'SaaS Platforms', mobileLabel: 'SaaS', color: '#25D366', distance: 9.0, speed: 0.1, size: 0.5, icon: 'nextdotjs' },
  { id: 'dashbi', label: 'Custom AI Models', mobileLabel: 'AI Models', color: '#60a5fa', distance: 11.0, speed: 0.08, size: 0.7, icon: 'pytorch' },
  { id: 'integ', label: 'Computer Vision', mobileLabel: 'Vision AI', color: '#f472b6', distance: 13.0, speed: 0.06, size: 0.5, icon: 'opencv' },
  { id: 'mobile', label: 'LLM Pipelines', mobileLabel: 'LLMs', color: '#fb923c', distance: 15.0, speed: 0.05, size: 0.6, icon: 'openai' },
  { id: 'dataint', label: 'Data Lakehouse', mobileLabel: 'Data Lake', color: '#4ade80', distance: 17.0, speed: 0.04, size: 0.8, icon: 'databricks' },
  { id: 'scope', label: 'Strategic Audit', mobileLabel: 'Audit', color: '#38bdf8', distance: 19.0, speed: 0.03, size: 0.5, icon: 'notion' },
];

function ShootingStar({ id, onComplete, type }) {
  const ref = useRef();
  const [data, setData] = useState(null);

  useEffect(() => {
    let pos, vel;
    const speed = 40 + Math.random() * 20;

    switch (type) {
      case 'background_fall':
        // Meteors falling vertically behind everything
        pos = [(Math.random() - 0.5) * 120, 50, -55];
        vel = [(Math.random() - 0.5) * 15, -speed - 10, (Math.random() - 0.5) * 5];
        break;
      case 'back_to_front':
        // Coming from deep space toward the camera
        pos = [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, -70];
        vel = [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, speed + 30];
        break;
      case 'right_to_left_cross':
        // Crossing behind or through the solar system
        pos = [90, Math.random() * 40 - 20, -10];
        vel = [-speed - 25, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5];
        break;
      case 'right_to_left_front':
        // Passing in front of the planets
        pos = [90, Math.random() * 30 - 15, 30];
        vel = [-speed - 30, (Math.random() - 0.5) * 5, -5];
        break;
      default:
        // Random fallback
        pos = [0, 0, -1000];
        vel = [0, 0, 0];
    }
    
    setData({ pos, vel: new THREE.Vector3(...vel) });
  }, [type]);

  useFrame((_, delta) => {
    if (!ref.current || !data) return;
    ref.current.position.addScaledVector(data.vel, delta);
    
    const p = ref.current.position;
    // Bounds check based on type (wide for crossers, deep for back-to-front)
    if (Math.abs(p.x) > 150 || Math.abs(p.y) > 100 || p.z > 80 || p.y < -100) {
      onComplete(id);
    }
  });

  if (!data) return null;

  return (
    <group ref={ref} position={data.pos}>
      <mesh>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#fff" transparent opacity={0.8} />
      </mesh>
      <Line 
        points={[[0, 0, 0], [-data.vel.x * 0.08, -data.vel.y * 0.08, -data.vel.z * 0.08]]} 
        color="white" 
        lineWidth={0.5} 
        transparent 
        opacity={0.2} 
      />
    </group>
  );
}

function MeteorSystem() {
  const [meteors, setMeteors] = useState([]);
  
  const spawn = (type, count = 1) => {
    const newMeteors = Array.from({ length: count }, () => ({
      id: Math.random(),
      type,
      delay: Math.random() * 1000
    }));
    
    newMeteors.forEach(m => {
      setTimeout(() => {
        setMeteors(prev => [...prev, m]);
      }, m.delay);
    });
  };

  const removeMeteor = (id) => {
    setMeteors(prev => prev.filter(m => m.id !== id));
  };

  useEffect(() => {
    let active = true;
    const sequence = [
      { type: 'background_fall', delay: 1500 },
      { type: 'back_to_front', delay: 2000 },
      { type: 'right_to_left_cross', delay: 1800 },
      { type: 'background_fall', delay: 1200 },
      { type: 'right_to_left_front', delay: 2500 },
      { type: 'back_to_front', delay: 2000 },
      { type: 'shower', delay: 5000 }
    ];

    const run = async () => {
      let i = 0;
      while (active) {
        const event = sequence[i % sequence.length];
        if (event.type === 'shower') {
          spawn('right_to_left_cross', 6);
        } else {
          spawn(event.type, 1);
        }
        
        await new Promise(r => setTimeout(r, event.delay));
        i++;
      }
    };

    run();
    return () => { active = false; };
  }, []);

  return (
    <>
      {meteors.map(m => (
        <ShootingStar 
          key={m.id} 
          id={m.id} 
          onComplete={removeMeteor} 
          type={m.type} 
        />
      ))}
    </>
  );
}

function SunLogo({ onSunClick }) {
  const texture = useTexture('/backgroundless-logo.jpeg');
  return (
    <group 
      onClick={(e) => { e.stopPropagation(); onSunClick && onSunClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* The Glowing Sun Sphere */}
      <mesh>
        <sphereGeometry args={[2.8, 64, 64]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#f59e0b" 
          emissiveIntensity={4} 
          toneMapped={false} 
        />
      </mesh>

      {/* The Logo Billboard (Printed on front) */}
      <Billboard follow={true}>
        <mesh position={[0, 0, 2.85]}>
          <planeGeometry args={[3.8, 3.8]} />
          <meshBasicMaterial 
            map={texture} 
            transparent={true} 
            depthTest={true}
            depthWrite={false}
            color="#fffbeb"
          />
        </mesh>
      </Billboard>
    </group>
  );
}

function OrbitRing({ radius }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.04, radius + 0.04, 64]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.06} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Planet({ data, isSelected, onClick, registerRef, visualProgressRef, isMobile, index }) {
  const ref = useRef();
  const labelRef = useRef();
  const initialAngle = useMemo(() => (index / PLANETS_DATA.length) * Math.PI * 2, [index]);

  const angleRef = useRef(initialAngle);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Accumulate angle based on delta to avoid 'teleporting' when speed changes
    const currentSpeed = isSelected ? data.speed * 0.1 : data.speed;
    angleRef.current += delta * currentSpeed;
    
    ref.current.position.x = Math.cos(angleRef.current) * data.distance;
    ref.current.position.z = Math.sin(angleRef.current) * data.distance;
    ref.current.rotation.y += isSelected ? 0.01 : 0.005;

    if (labelRef.current && visualProgressRef) {
      const vp = visualProgressRef.current;
      labelRef.current.style.opacity = isSelected ? '0' : (vp > 0.4 ? '1' : '0');
    }
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

      <Html position={[0, data.size + 0.8, 0]} center style={{ pointerEvents: 'none' }}>
        <div ref={labelRef} style={{
          opacity: 0,
          transition: 'opacity 0.3s',
          color: 'rgba(255,255,255,0.9)',
          fontSize: isMobile ? '10px' : '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          background: 'rgba(0,0,0,0.6)',
          padding: isMobile ? '2px 6px' : '4px 10px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)',
          whiteSpace: 'nowrap',
          border: `1px solid ${data.color}44`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <img src={`${CDN}${data.icon}.svg`} alt="" style={{ width: '12px', height: '12px', filter: 'brightness(0) invert(1)' }} />
          {isMobile ? data.mobileLabel : data.label}
        </div>
      </Html>
    </group>
  );
}

function SolarSystem({ selectedId, onSelectPlanet, visualProgressRef, isMobile, onSunClick }) {
  const planetsRef = useRef({});
  const controlsRef = useRef();
  const groupRef = useRef();
  const sunLabelRef = useRef();

  useFrame((state) => {
    const vp = visualProgressRef ? visualProgressRef.current : 0;
    const mobileScaleFactor = isMobile ? 0.7 : 1.0;
    const targetScale = vp < 0.4 ? 0 : Math.min(mobileScaleFactor, (vp - 0.4) / 0.3 * mobileScaleFactor);
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (sunLabelRef.current) {
      sunLabelRef.current.style.opacity = selectedId ? '0' : (vp > 0.4 ? '1' : '0');
    }

    const controls = controlsRef.current;
    if (!controls) return;

    if (selectedId && planetsRef.current[selectedId]) {
      const planet = planetsRef.current[selectedId];
      const targetPos = new THREE.Vector3();
      planet.getWorldPosition(targetPos);

      // Dynamic Camera Position: Calculate a point 'outside' the planet's current orbit position
      const orbitDir = targetPos.clone().normalize();
      if (orbitDir.length() < 0.1) orbitDir.set(1, 0, 0); // Fallback for center
      
      const cameraDist = 5; // Distance from planet
      const cameraHeight = 1.5;
      const desiredCameraPos = targetPos.clone().add(orbitDir.multiplyScalar(cameraDist));
      desiredCameraPos.y += cameraHeight;

      state.camera.position.lerp(desiredCameraPos, 0.05);
      controls.target.lerp(targetPos, 0.05);
    } else {
      const defaultCameraPos = new THREE.Vector3(0, 20, 35);
      state.camera.position.lerp(defaultCameraPos, 0.03);
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.03);
    }
    controls.update();
  });

  return (
    <group ref={groupRef} position={isMobile ? [0, -5, 0] : [0, 0, 0]}>
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

      <MeteorSystem />

      <SunLogo onSunClick={onSunClick} />

      <Html position={[0, 4, 0]} center style={{ pointerEvents: 'none' }}>
        {/* <div ref={sunLabelRef} style={{
          opacity: 0, transition: 'opacity 0.3s',
          color: '#fbbf24', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Inter, sans-serif',
          background: 'rgba(0,0,0,0.6)', padding: '6px 16px', borderRadius: '8px', border: '1px solid #fbbf2466',
          whiteSpace: 'nowrap', backdropFilter: 'blur(4px)'
        }}>
        </div> */}
      </Html>

      {PLANETS_DATA.map((planet, index) => (
        <group key={planet.id}>
          <OrbitRing radius={planet.distance} />
          <Planet
            data={planet}
            isSelected={selectedId === planet.id}
            onClick={onSelectPlanet}
            registerRef={(id, ref) => { planetsRef.current[id] = ref; }}
            visualProgressRef={visualProgressRef}
            isMobile={isMobile}
            index={index}
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

const HeroOrganicNetwork = ({ onSunClick }) => {
  const [selectedId, setSelectedId] = useState(null);
  const selectedPlanet = PLANETS_DATA.find(p => p.id === selectedId);

  const wrapperRef = useRef(null);
  const iconRefs = useRef([]);
  const particlesRef = useRef([]);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const visualProgressRef = useRef(0);
  const heroTextRef = useRef();
  const exploreTextRef = useRef();
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize background HTML particles
  useEffect(() => {
    const W = window.innerWidth, H = window.innerHeight;
    const iconCount = isMobile ? 12 : FLOAT_ICONS.length;
    const icons = FLOAT_ICONS.slice(0, iconCount);
    const cols = Math.ceil(Math.sqrt(icons.length));
    const rows = Math.ceil(icons.length / cols);
    const cellW = (W - (isMobile ? 60 : 160)) / cols;
    const cellH = (H - (isMobile ? 60 : 160)) / rows;

    // Precise Freeform Exclusion Zones (Relative to center)
    const getZones = (w, h) => isMobile ? [
      { w: 320, h: 480, y: 0 }
    ] : [
      { w: 180, h: 50, y: -200 }, // Badge
      { w: 720, h: 90, y: -120 }, // Headline L1
      { w: 600, h: 90, y: -40 },  // Headline L2
      { w: 500, h: 90, y: 40 },   // Headline L3
      { w: 850, h: 160, y: 160 }, // Subtitle
      { w: 320, h: 70, y: 280 }   // Button
    ];

    particlesRef.current = icons.map((icon, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // More uniform grid with reduced jitter to prevent initial clustering
      let hX = (isMobile ? 30 : 80) + col * cellW + cellW * 0.5 + (Math.random() - 0.5) * cellW * 0.3;
      let hY = (isMobile ? 30 : 80) + row * cellH + cellH * 0.5 + (Math.random() - 0.5) * cellH * 0.3;

      // Initial Exclusion: Push out of any active zone
      const zones = getZones(W, H);
      zones.forEach(z => {
        const dx = hX - W / 2;
        const dy = hY - (H / 2 + z.y);
        if (Math.abs(dx) < z.w / 2 && Math.abs(dy) < z.h / 2) {
          hX = W / 2 + (dx > 0 ? z.w / 2 + 40 : -(z.w / 2 + 40));
        }
      });

      return {
        homeX: hX,
        homeY: hY,
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
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

      // Threshold logic: Trigger full animation if scroll > 10%
      const targetVisual = p > 0.1 ? 1 : (p < 0.05 ? 0 : visualProgressRef.current);
      visualProgressRef.current += (targetVisual - visualProgressRef.current) * 0.015;
      const vp = visualProgressRef.current;

      // Convergence logic: icons drift -> converge to center by vp=0.4
      const convergeT = clamp(vp / 0.4, 0, 1);
      const easeConverge = easeInOutCubic(convergeT);

      particlesRef.current.forEach((pt, i) => {
        // Brownian drift
        pt.vx += (Math.random() - 0.5) * 0.05;
        pt.vy += (Math.random() - 0.5) * 0.05;

        // Inter-particle Repulsion (Prevent icons from overlapping each other)
        particlesRef.current.forEach((other, j) => {
          if (i === j) return;
          const dx = pt.homeX - other.homeX;
          const dy = pt.homeY - other.homeY;
          const distSq = dx * dx + dy * dy;
          const minDist = 100; // Minimum distance between icons
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 1;
            const force = (minDist - dist) * 0.002;
            pt.vx += (dx / dist) * force;
            pt.vy += (dy / dist) * force;
          }
        });

        // Freeform Stepped Repulsion (Avoid precise text areas)
        const zones = isMobile ? [
          { w: 340, h: 500, y: 0 }
        ] : [
          { w: 200, h: 60, y: -200 }, // Badge
          { w: 750, h: 100, y: -120 }, // Headline L1
          { w: 620, h: 100, y: -40 },  // Headline L2
          { w: 520, h: 100, y: 40 },   // Headline L3
          { w: 880, h: 180, y: 160 },  // Subtitle
          { w: 350, h: 90, y: 280 }    // Button
        ];

        zones.forEach(z => {
          const zcx = cx;
          const zcy = cy + z.y;
          const dx = pt.homeX - zcx;
          const dy = pt.homeY - zcy;
          if (Math.abs(dx) < z.w / 2 && Math.abs(dy) < z.h / 2) {
            const pushForce = 0.15;
            pt.vx += dx > 0 ? pushForce : -pushForce;
            pt.vy += dy > 0 ? pushForce : -pushForce;
          }
        });

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

      // Update Hero Text Opacity
      if (heroTextRef.current) {
        const heroOp = clamp(1 - (vp / 0.2), 0, 1);
        heroTextRef.current.style.opacity = heroOp.toFixed(3);
        heroTextRef.current.style.pointerEvents = heroOp > 0.5 ? 'auto' : 'none';
      }

      // Update Explore Text Opacity
      if (exploreTextRef.current) {
        exploreTextRef.current.style.opacity = (vp > 0.7 && !selectedIdRef.current) ? '1' : '0';
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapperRef} className="hon-wrapper" style={{ height: '250vh' }}>
      <div className="hon-sticky" style={{ height: '100vh', position: 'sticky', top: 0, overflow: 'hidden', background: '#050505' }}>

        {/* HTML Floating Icons (Phase 0 -> Phase 1) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          {(isMobile ? FLOAT_ICONS.slice(0, 12) : FLOAT_ICONS).map((icon, i) => {
            const IconComp = CUSTOM_ICONS[icon];
            return (
              <div key={icon + i} ref={el => iconRefs.current[i] = el} style={{ position: 'absolute', top: 0, left: 0 }}>
                {IconComp ? (
                  <IconComp size={32} color="#444" style={{ opacity: 0.8 }} />
                ) : (
                  <img src={`${CDN}${icon}.svg`} alt="" style={{ width: '32px', height: '32px', filter: 'brightness(0) invert(0.4)' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Phase 0: Hero Copy */}
        <div ref={heroTextRef} className="hon-hero-text" style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', zIndex: 10
        }}>
          <h1 className="hero-title" style={{ fontSize: isMobile ? '2.5rem' : '4rem', color: '#fff', margin: '20px 0', lineHeight: 1.1 }}>
            Transforming your<br />
            <em style={{ color: '#fbbf24', fontStyle: 'normal' }}>raw data into</em><br />
            intelligence
          </h1>
          <p className="hero-subtitle" style={{ color: '#aaa', fontSize: isMobile ? '1rem' : '1.2rem', marginBottom: '30px' }}>
            We don't just build apps; we engineer the pipelines that turn your scattered
            Excel sheets, databases, and warehouse records into high-performance business assets.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a href="#engagements" className="btn btn-dark" style={{ background: '#fbbf24', color: '#000', padding: '12px 24px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold' }}>
              Book a Discovery Call
            </a>
          </div>
          <div className="scroll-indicator" style={{ marginTop: '40px' }}><div className="scroll-line" style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.2)', margin: '0 auto' }} /></div>
        </div>

        {/* 3D Canvas (Scales up during Phase 1 -> Phase 2) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: isMobile ? '85vh' : '100%', zIndex: 0,
          touchAction: 'pan-y' // Allow vertical scrolling on mobile
        }}>
          <Canvas camera={{ position: [0, 20, 35], fov: 45 }} style={{ touchAction: 'pan-y' }}>
            <SolarSystem selectedId={selectedId} onSelectPlanet={setSelectedId} visualProgressRef={visualProgressRef} isMobile={isMobile} onSunClick={onSunClick} />
          </Canvas>
        </div>

        {/* Foreground UI Overlay (Phase 3) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          pointerEvents: 'none', display: 'flex', flexDirection: 'column', padding: '40px', zIndex: 3
        }}>

          {/* Intro text when nothing is selected */}
          <div ref={exploreTextRef} style={{
            opacity: 0, transition: 'opacity 0.5s',
            maxWidth: '600px', marginTop: '10vh', marginLeft: '5vw'
          }}>
            <h1 style={{ fontSize: isMobile ? '2.5rem' : '4rem', color: '#fff', margin: 0, lineHeight: 1.1, fontFamily: 'Inter, sans-serif' }}>
              We build <br /><span style={{ color: '#fbbf24' }}>Data Intelligence</span>
            </h1>
            <p style={{ color: '#aaa', fontSize: '1.2rem', marginTop: '20px', fontFamily: 'Inter, sans-serif' }}>
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
                  <h2 style={{ color: selectedPlanet.color, fontSize: isMobile ? '1.5rem' : '2.5rem', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                    {isMobile ? selectedPlanet.mobileLabel : selectedPlanet.label}
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
