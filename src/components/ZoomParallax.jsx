import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef } from 'react';

export function ZoomParallax({ images, title, subtitle, children, containerRef }) {
	const container = useRef(null);
  
	const { scrollYProgress } = useScroll({
		target: container,
    container: containerRef, // This is crucial for scrolling inside a modal
		offset: ['start start', 'end end'],
	});

	// Outer images scale and drift
	const scaleOut = useTransform(scrollYProgress, [0, 0.8], [1, 15]);
	const opacityOut = useTransform(scrollYProgress, [0.4, 0.8], [1, 0]);
  
  // Center image (index 0) scales to "enter"
  const scaleCenter = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const opacityCenter = useTransform(scrollYProgress, [0.85, 1], [1, 0]);

  // Title fade out
  const titleOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.9]);

	return (
    <div className="zp-wrapper">
      <div ref={container} className="zp-container">
        <div className="zp-sticky">
          {/* Title Overlay */}
          <motion.div 
            className="zp-overlay"
            style={{ opacity: titleOpacity, scale: titleScale, zIndex: 100 }}
          >
            {subtitle && <p className="section-label" style={{ color: '#c026d3' }}>{subtitle}</p>}
            {title && <h2 className="section-title">{title}</h2>}
            <div className="zp-mouse-hint">
              <div className="mouse-icon">
                <div className="mouse-wheel" />
              </div>
              <span>Scroll to Enter</span>
            </div>
          </motion.div>

          {images.map(({ src, alt }, index) => {
            const isCenter = index === 0;
            const scale = isCenter ? scaleCenter : scaleOut;
            const opacity = isCenter ? opacityCenter : opacityOut;

            return (
              <motion.div
                key={index}
                style={{ scale, opacity }}
                className={`zp-item zp-item-${index}`}
              >
                <div className="zp-image-wrapper">
                  <img
                    src={src || '/placeholder.svg'}
                    alt={alt || `Parallax image ${index + 1}`}
                    className="zp-image"
                  />
                  {isCenter && <div className="zp-portal-glow" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <motion.div 
        className="zp-revealed-content"
        style={{ 
          opacity: useTransform(scrollYProgress, [0.8, 1], [0, 1]),
          y: useTransform(scrollYProgress, [0.8, 1], [50, 0])
        }}
      >
        {children}
      </motion.div>
    </div>
	);
}

export default ZoomParallax;
