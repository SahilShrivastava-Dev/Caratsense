import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

const PhysicsOverlay = () => {
  const sceneRef = useRef(null);
  const elementsRef = useRef([]);

  // The actual UI text items we want floating
  const items = [
    { id: 'item1', text: 'caratsense AI.', width: 400, height: 60, cls: 'physics-text bold' },
    { id: 'item2', text: 'instant estimation', width: 420, height: 60, cls: 'physics-text silver' },
    { id: 'item3', text: 'itemized breakdowns', width: 480, height: 60, cls: 'physics-text' },
    { id: 'item4', text: 'market values', width: 330, height: 60, cls: 'physics-text silver' },
    { id: 'item5', text: 'precision metrics', width: 380, height: 60, cls: 'physics-text' },
  ];

  const [positions, setPositions] = useState({});

  useEffect(() => {
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Events = Matter.Events;

    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 } // Zero gravity
    });

    const world = engine.world;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent'
      }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Create boundaries
    const wallOptions = { 
      isStatic: true, 
      restitution: 0.8, // Bouncy edges
      render: { visible: false } 
    };

    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallThickness = 100;

    Composite.add(world, [
      Bodies.rectangle(width / 2, -wallThickness/2, width, wallThickness, wallOptions), // top
      Bodies.rectangle(width / 2, height + wallThickness/2, width, wallThickness, wallOptions), // bottom
      Bodies.rectangle(width + wallThickness/2, height / 2, wallThickness, height, wallOptions), // right
      Bodies.rectangle(-wallThickness/2, height / 2, wallThickness, height, wallOptions) // left
    ]);

    // Create bodies for floating text
    const bodies = [];
    const initialPositions = {};

    items.forEach((item) => {
      // Randomly scatter items
      const x = Math.max(200, Math.random() * (width - 200));
      const y = Math.max(100, Math.random() * (height - 100));
      
      const body = Bodies.rectangle(x, y, item.width, item.height, {
        restitution: 0.9,          // Bounciness
        frictionAir: 0.02,         // Smooth inertia/friction in space
        friction: 0.1,
        render: { visible: false } // Invisible, we show React DOM instead
      });

      // Give a tiny initial spin and momentum
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

      body.label = item.id;
      bodies.push(body);
      initialPositions[item.id] = { x, y, angle: 0 };
    });

    Composite.add(world, bodies);
    setPositions(initialPositions);

    // Mouse Interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    Composite.add(world, mouseConstraint);

    // Sync mouse to avoid issue on scroll
    render.mouse = mouse;

    // Repulsion from cursor
    let mousePos = { x: -1000, y: -1000 };
    Events.on(mouseConstraint, 'mousemove', (e) => {
      mousePos = e.mouse.position;
    });

    Events.on(engine, 'beforeUpdate', () => {
      const bodiesInWorld = Composite.allBodies(world).filter(b => !b.isStatic);
      
      bodiesInWorld.forEach(body => {
        // Prevent body from completely stopping
        if (body.speed < 0.2) {
          Matter.Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * 0.0001,
            y: (Math.random() - 0.5) * 0.0001
          });
        }

        // Mouse repulsion
        if (mousePos.x > 0 && mousePos.y > 0) {
          const dx = body.position.x - mousePos.x;
          const dy = body.position.y - mousePos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            const forceMagnitude = 0.0005 * (200 - distance); 
            Matter.Body.applyForce(body, body.position, {
              x: (dx / distance) * forceMagnitude,
              y: (dy / distance) * forceMagnitude
            });
          }
        }
      });
    });

    // Sync bodies back to React State
    Events.on(engine, 'afterUpdate', () => {
      const newPos = {};
      bodies.forEach(body => {
        newPos[body.label] = {
          x: body.position.x,
          y: body.position.y,
          angle: body.angle
        };
      });
      setPositions(newPos);
    });

    // Handle Resize
    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: window.innerWidth, y: window.innerHeight }
      });
      // We could ideally rebuild walls here, but since it's zero gravity, bouncing off bounds is fine if they drift out, or we can just leave it.
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
      render.canvas = null;
      render.context = null;
      render.textures = {};
    };
  }, []);

  return (
    <>
      {/* Background Matter.js canvas will capture mouse drag events.
          Must be above the DOM elements if we want dragging natively without CSS pointer-events issues. */}
      <div 
        ref={sceneRef} 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 50 // Needs to be highest so mouse acts on it!
        }} 
      />

      {/* DOM Elements layered UNDER the canvas, but positions bound to the physical bodies */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        {items.map(item => {
          const pos = positions[item.id];
          if (!pos) return null;

          return (
            <div
              key={item.id}
              className={item.cls}
              style={{
                transform: `translate(${pos.x - item.width / 2}px, ${pos.y - item.height / 2}px) rotate(${pos.angle}rad)`,
                width: item.width,
                height: item.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                willChange: 'transform'
              }}
            >
              {item.text}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PhysicsOverlay;
