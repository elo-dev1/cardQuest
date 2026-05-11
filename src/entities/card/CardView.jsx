import { CATEGORIES } from '@/shared/data/taskTemplates';
import { RARITIES, STAR_LEVELS } from '@/shared/data/cardData';

export const CardView = ({ card, count = 0, stars = 0, isNew = false, size = 'sm', locked = false, onClick }) => {
  const rarity = RARITIES[card?.rarity] || RARITIES.common;
  const starLevel = STAR_LEVELS[stars] || STAR_LEVELS[0];
  const category = CATEGORIES[card?.category] || CATEGORIES.special;
  const [from, to] = (category.gradient || '#8b5cf6,#7c3aed').split(',');
  const dimensions = size === 'lg' ? 'h-[250px] w-[180px]' : size === 'md' ? 'h-[168px] w-[120px]' : 'h-[140px] w-[100px]';
  const hasImage = Boolean(card?.image);

  const baseBorder = starLevel.borderWidth;
  const glowMultiplier = starLevel.glowIntensity;
  const baseGlow = rarity.glow === 'none' ? 'none' : rarity.glow.replace(/rgba?\([^)]+\)/g, (match) => {
    const num = parseFloat(match.replace(/[rgba()\s]/g, '').split(',')[3] || '0.3');
    return match.replace(/[\d.]+(?=\))/, String(Math.min(1, num * glowMultiplier)));
  });

  const starDisplay = starLevel.label;
  const attackDisplay = card ? Math.round(card.attack * starLevel.multiplier) : 0;
  const defenseDisplay = card ? Math.round(card.defense * starLevel.multiplier) : 0;

  if (locked) {
    return (
      <button
        type="button"
        className={`${dimensions} overflow-hidden rounded-[14px] border-2 border-dashed border-gray-300 bg-gray-100 text-gray-400`}
        onClick={onClick}
      >
        <div className="grid h-[65%] place-items-center text-3xl">❓</div>
        <div className="grid h-[35%] place-items-center bg-white px-2 text-center text-[11px] font-extrabold">
          Не найдена
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${dimensions} group relative overflow-hidden rounded-[14px] bg-white text-left transition hover:-translate-y-1 ${
        card.rarity === 'legendary' ? 'legendary-pulse' : stars > 0 ? 'star-glow' : ''
      }`}
      style={{
        border: `${baseBorder}px solid ${rarity.color}`,
        boxShadow: baseGlow === 'none' ? 'none' : baseGlow,
      }}
    >
      {count > 1 ? (
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-[var(--c-purple)] px-2 py-0.5 text-[12px] font-black text-white">
          x{count}
        </span>
      ) : null}
      {isNew ? (
        <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-[var(--c-green)] px-2 py-0.5 text-[9px] font-black text-white">
          NEW
        </span>
      ) : null}
      {stars > 0 ? (
        <span className="absolute left-1.5 bottom-1.5 z-10 text-[10px] leading-none star-shine">
          {starDisplay}
        </span>
      ) : null}
      {hasImage ? (
        <>
          <img className="absolute inset-0 h-full w-full object-cover" src={card.image} alt={card.name} loading="lazy" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent px-2 pb-2 pt-9 text-center">
            <div className={`${size === 'lg' ? 'text-lg' : 'text-[11px]'} line-clamp-2 font-black leading-tight text-[var(--text-primary)]`}>
              {card.name}
            </div>
            {size === 'lg' && stars > 0 && (
              <div className="star-label-glow">{starDisplay}</div>
            )}
            <div className={`${size === 'lg' ? 'text-xs' : 'text-[9px]'} mt-1 font-extrabold`} style={{ color: rarity.color }}>
              {rarity.label}
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            className="grid h-[65%] place-items-center text-[32px] drop-shadow-lg"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            <span className={size === 'lg' ? 'text-6xl' : ''}>{card.emoji}</span>
          </div>
          <div className="flex h-[35%] flex-col justify-center bg-white px-2 text-center">
            <div className={`${size === 'lg' ? 'text-lg' : 'text-[11px]'} line-clamp-2 font-black leading-tight text-[var(--text-primary)]`}>
              {card.name}
            </div>
            {size === 'lg' && stars > 0 && (
              <div className="star-label-glow">{starDisplay}</div>
            )}
            <div className={`${size === 'lg' ? 'text-xs' : 'text-[9px]'} mt-1 font-extrabold`} style={{ color: rarity.color }}>
              {rarity.label}
            </div>
          </div>
        </>
      )}
    </button>
  );
};