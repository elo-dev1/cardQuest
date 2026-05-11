import { useEffect, useState } from 'react';

const colors = ['#f59e0b', '#a855f7', '#22c55e', '#ec4899', '#38bdf8', '#fde68a'];

export const GlobalConfetti = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const handler = () => {
      const burst = Array.from({ length: 24 }, (_, index) => ({
        id: `${Date.now()}-${index}`,
        color: colors[index % colors.length],
        tx: `${Math.round((Math.random() - 0.5) * 420)}px`,
        ty: `${Math.round(-160 - Math.random() * 220)}px`,
        tr: `${Math.round(Math.random() * 720 - 360)}deg`,
        delay: `${Math.random() * 0.18}s`,
      }));
      setParticles((current) => [...current, ...burst]);
      window.setTimeout(() => {
        setParticles((current) => current.filter((particle) => !burst.some((item) => item.id === particle.id)));
      }, 1600);
    };

    window.addEventListener('confetti:fire', handler);
    return () => window.removeEventListener('confetti:fire', handler);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9997] overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute bottom-12 left-1/2 h-3 w-2 rounded-sm"
          style={{
            background: particle.color,
            '--tx': particle.tx,
            '--ty': particle.ty,
            '--tr': particle.tr,
            animation: `confettiFly 1.35s ease-out ${particle.delay} forwards`,
          }}
        />
      ))}
    </div>
  );
};
