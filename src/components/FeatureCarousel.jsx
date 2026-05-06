import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Plug2, 
  Smartphone, 
  LineChart, 
  ClipboardCheck 
} from "lucide-react";

const FEATURES = [
  {
    id: "01",
    label: "Industry Operating Systems",
    icon: Building2,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200",
    description: "End-to-end platforms covering orders, inventory, billing, customers, field ops, and reporting.",
  },
  {
    id: "02",
    label: "AI & ML Modules",
    icon: Brain,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200",
    description: "Computer vision, predictive analytics, NLP, forecasting, and anomaly detection.",
  },
  {
    id: "03",
    label: "WhatsApp Business Stack",
    icon: MessageSquare,
    image: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?q=80&w=1200",
    description: "Managed campaigns, drip flows, order capture, support bots, and payment links.",
  },
  {
    id: "04",
    label: "Dashboards & BI",
    icon: BarChart3,
    image: "https://images.unsplash.com/photo-1551288049-bbda38a10ad5?q=80&w=1200",
    description: "Live ops dashboards, sales intelligence, and owner-level KPI rollups.",
  },
  {
    id: "05",
    label: "Integrations",
    icon: Plug2,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=1200",
    description: "Seamlessly connecting Tally, Zoho, payment gateways, and IoT sensors.",
  },
  {
    id: "06",
    label: "Mobile Applications",
    icon: Smartphone,
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200",
    description: "Native Android and iOS apps for field teams, distributors, and customers.",
  },
  {
    id: "07",
    label: "Data Intelligence Platforms",
    icon: LineChart,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200",
    description: "Unified decisioning layer for Tally, CRM, and WhatsApp data.",
  },
  {
    id: "08",
    label: "Scope & Audit Work",
    icon: ClipboardCheck,
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200",
    description: "Operational audits, bottleneck mapping, and architecture flowcharts.",
  },
];

const AUTO_PLAY_INTERVAL = 4000;
const ITEM_HEIGHT = 70;

const wrap = (min, max, v) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentIndex =
    ((step % FEATURES.length) + FEATURES.length) % FEATURES.length;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index) => {
    const diff = (index - currentIndex + FEATURES.length) % FEATURES.length;
    if (diff > 0) setStep((s) => s + diff);
    else if (diff < 0) setStep((s) => s + (FEATURES.length + diff));
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextStep, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [nextStep, isPaused]);

  const getCardStatus = (index) => {
    const diff = index - currentIndex;
    const len = FEATURES.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    if (normalizedDiff === 0) return "active";
    if (normalizedDiff === -1) return "prev";
    if (normalizedDiff === 1) return "next";
    return "hidden";
  };

  return (
    <div className="fc-container">
      <div className="fc-main-frame">
        
        {/* Left Side: Text Navigation */}
        <div className="fc-sidebar">
          <div className="fc-sidebar-fade-top" />
          <div className="fc-sidebar-fade-bottom" />
          
          <div className="fc-sidebar-track">
            {FEATURES.map((feature, index) => {
              const isActive = index === currentIndex;
              const distance = index - currentIndex;
              const wrappedDistance = wrap(
                -(FEATURES.length / 2),
                FEATURES.length / 2,
                distance
              );

              return (
                <motion.div
                  key={feature.id}
                  style={{
                    height: ITEM_HEIGHT,
                    width: "fit-content",
                  }}
                  animate={{
                    y: wrappedDistance * ITEM_HEIGHT,
                    opacity: 1 - Math.abs(wrappedDistance) * 0.35,
                    scale: isActive ? 1 : 0.85,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                  }}
                  className="fc-chip-wrapper"
                >
                  <button
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={`fc-chip ${isActive ? 'active' : ''}`}
                  >
                    <div className="fc-chip-icon">
                      <feature.icon size={18} strokeWidth={2} />
                    </div>

                    <span className="fc-chip-label">
                      {feature.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Image Display */}
        <div className="fc-content">
          <div className="fc-card-stack">
            {FEATURES.map((feature, index) => {
              const status = getCardStatus(index);
              const isActive = status === "active";
              const isPrev = status === "prev";
              const isNext = status === "next";

              return (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : isPrev ? -120 : isNext ? 120 : 0,
                    scale: isActive ? 1 : isPrev || isNext ? 0.82 : 0.7,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.35 : 0,
                    rotate: isPrev ? -4 : isNext ? 4 : 0,
                    zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 24,
                  }}
                  className="fc-card"
                >
                  <img
                    src={feature.image}
                    alt={feature.label}
                    className={`fc-card-img ${isActive ? 'active' : ''}`}
                  />

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fc-card-overlay"
                      >
                        <p className="fc-card-desc">
                          {feature.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureCarousel;
