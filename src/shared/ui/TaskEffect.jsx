import { useEffect, useState } from 'react';

const EFFECT_CONFIGS = {
  golden_stars: {
    count: 40,
    colors: ['#f59e0b', '#fde68a', '#fbbf24', '#fcd34d', '#ffffff'],
    shapes: ['star', 'circle'],
    animation: 'taskEffectGolden 2.2s ease-out forwards',
    duration: 2200,
  },
  rainbow_fireworks: {
    count: 50,
    colors: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#fde68a'],
    shapes: ['circle', 'square'],
    animation: 'taskEffectFirework 2.6s ease-out forwards',
    duration: 2600,
  },
  magic_sparkles: {
    count: 35,
    colors: ['#a855f7', '#c084fc', '#e879f9', '#d8b4fe', '#ffffff'],
    shapes: ['star', 'diamond'],
    animation: 'taskEffectMagic 2.4s ease-out forwards',
    duration: 2400,
  },
  confetti_rain: {
    count: 45,
    colors: ['#f59e0b', '#a855f7', '#22c55e', '#ec4899', '#38bdf8', '#fde68a', '#ef4444'],
    shapes: ['rectangle', 'circle'],
    animation: 'taskEffectRain 2.8s ease-out forwards',
    duration: 2800,
  },
  hero_burst: {
    count: 60,
    colors: ['#ef4444', '#f97316', '#f59e0b', '#fde68a', '#ffffff'],
    shapes: ['star', 'circle', 'diamond'],
    animation: 'taskEffectBurst 2s ease-out forwards',
    duration: 2000,
  },
};

const shapeToClipPath = (shape) => {
  switch (shape) {
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'rectangle':
      return 'none';
    case 'circle':
    default:
      return '50%';
  }
};

export const TaskEffect = () => {
  const [particles, setParticles] = useState([]);
  const [showRing, setShowRing] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      const effectType = event.detail?.effectType || 'golden_stars';
      const config = EFFECT_CONFIGS[effectType] || EFFECT_CONFIGS.golden_stars;

      const burst = Array.from({ length: config.count }, (_, index) => {
        const angle = (Math.PI * 2 * index) / config.count + (Math.random() - 0.5) * 0.5;
        const distance = 120 + Math.random() * 300;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 50;
        const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
        const size = 8 + Math.random() * 16;

        return {
          id: `${Date.now()}-${effectType}-${index}`,
          color: config.colors[index % config.colors.length],
          tx: `${tx}px`,
          ty: `${ty}px`,
          tr: `${Math.random() * 720 - 360}deg`,
          delay: `${Math.random() * 0.15}s`,
          shape,
          size,
          clipPath: shapeToClipPath(shape),
          animation: config.animation,
        };
      });

      setParticles((current) => [...current, ...burst]);
      setShowRing(true);

      window.setTimeout(() => {
        setParticles((current) => current.filter((p) => !burst.some((b) => b.id === p.id)));
      }, config.duration + 200);

      window.setTimeout(() => setShowRing(false), 600);
    };

    window.addEventListener('task:effect', handler);
    return () => window.removeEventListener('task:effect', handler);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      {showRing && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '3px solid rgba(245, 158, 11, 0.8)',
          animation: 'effectRingExpand 0.6s ease-out forwards',
        }} />
      )}
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: particle.color,
            clipPath: particle.clipPath,
            borderRadius: particle.shape === 'circle' ? '50%' : '0',
            '--tx': particle.tx,
            '--ty': particle.ty,
            '--tr': particle.tr,
            animation: `${particle.animation} ${particle.delay}`,
          }}
        />
      ))}
    </div>
  );
};
