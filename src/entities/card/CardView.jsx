import { CATEGORIES } from '@/shared/data/taskTemplates';
import { RARITIES, STAR_LEVELS } from '@/shared/data/cardData';

const categoryArtBg = {
  health: 'linear-gradient(135deg, #EBF8F0, #D1F0DF)',
  activity: 'linear-gradient(135deg, #FDF3E8, #F9E0C5)',
  study: 'linear-gradient(135deg, #EBF0FB, #D1DCF7)',
  home: 'linear-gradient(135deg, #EDFBF2, #D4F5E1)',
  care: 'linear-gradient(135deg, #FDE8ED, #FAC9D2)',
  special: 'linear-gradient(135deg, #F0EBFB, #DDD1F7)',
};

export const CardView = ({ card, count = 0, stars = 0, isNew = false, size = 'sm', locked = false, onClick, selected = false }) => {
  const rarity = RARITIES[card?.rarity] || RARITIES.common;
  const starLevel = STAR_LEVELS[stars] || STAR_LEVELS[0];
  const category = CATEGORIES[card?.category] || CATEGORIES.special;
  const artBg = categoryArtBg[card?.category] || categoryArtBg.special;
  const dimensions = size === 'lg' ? 'h-[250px] w-[180px]' : size === 'md' ? 'h-[168px] w-[120px]' : size === 'fill' ? 'w-full h-full' : 'h-[140px] w-[100px]';
  const hasImage = Boolean(card?.image);

  const starDisplay = starLevel.label;

  if (locked) {
    return (
      <button
        type="button"
        className={`${dimensions} overflow-hidden rounded-[var(--r-md)] border border-[var(--border-soft)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)] transition hover:-translate-y-1 hover:shadow-sm`}
        onClick={onClick}
      >
        <div className="grid h-[65%] place-items-center text-3xl" style={{ filter: 'grayscale(0.7)' }}>❓</div>
        <div className="grid h-[35%] place-items-center bg-[var(--bg-surface)] px-2 text-center text-[11px] font-semibold">
          Не найдена
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${dimensions} group relative overflow-hidden rounded-[var(--r-md)] bg-[var(--bg-surface)] text-left transition-all duration-[180ms] ${selected ? 'ring-2 ring-[var(--charcoal)] ring-offset-2' : ''} ${card.rarity === 'legendary' ? 'legendary-pulse' : stars > 0 ? 'star-glow' : ''}`}
      style={{
        border: `${starLevel.borderWidth}px solid ${rarity.color}`,
        boxShadow: rarity.glow === 'none' ? 'var(--shadow-card)' : undefined,
      }}
    >
      {count > 1 ? (
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-[var(--charcoal)] px-2 py-0.5 text-[11px] font-semibold text-white">
          x{count}
        </span>
      ) : null}
      {selected ? (
        <span className="absolute left-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--charcoal)] text-sm font-semibold text-white">
          ✓
        </span>
      ) : null}
      {isNew ? (
        <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-[var(--sage)] px-2 py-0.5 text-[9px] font-semibold text-white">
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
          <img className="absolute inset-0 h-[65%] w-full object-cover" src={card.image} alt={card.name} loading="lazy" />
          <div className="absolute inset-x-0 bottom-0 h-[35%] bg-[var(--bg-surface)] px-2 pb-2 pt-2 text-center">
            <div className={`${size === 'lg' ? 'text-sm' : 'text-[11px]'} line-clamp-1 font-semibold leading-tight text-[var(--text-primary)]`}>
              {card.name}
            </div>
            <div className={`${size === 'lg' ? 'text-[10px]' : 'text-[9px]'} mt-0.5 font-medium`} style={{ color: rarity.color }}>
              {rarity.label}
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            className="grid h-[65%] place-items-center drop-shadow-sm"
            style={{ background: artBg }}
          >
            <span className={`${size === 'lg' ? 'text-5xl' : 'text-[32px]'} transition-transform duration-[180ms] group-hover:scale-110`}>{card.emoji}</span>
          </div>
          <div className="flex h-[35%] flex-col justify-center bg-[var(--bg-surface)] px-2 text-center">
            <div className={`${size === 'lg' ? 'text-sm' : 'text-[11px]'} line-clamp-1 font-semibold leading-tight text-[var(--text-primary)]`}>
              {card.name}
            </div>
            <div className={`${size === 'lg' ? 'text-[10px]' : 'text-[9px]'} mt-0.5 font-medium`} style={{ color: rarity.color }}>
              {rarity.label}
            </div>
          </div>
        </>
      )}
    </button>
  );
};
