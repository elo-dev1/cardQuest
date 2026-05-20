import { useState } from 'react';
import { PACK_TYPES, SHOP_ITEMS, EFFECT_TYPES, BACKGROUND_TYPES, BOOST_TYPES } from '@/shared/data/shopItems';
import { useStore } from '@/shared/store/useStore';
import { SegmentedControl } from '@/shared/ui/SegmentedControl';

export const ShopPage = () => {
  const family = useStore((state) => state.family);
  const spendCoins = useStore((state) => state.spendCoins);
  const buyItem = useStore((state) => state.buyItem);
  const buyEffect = useStore((state) => state.buyEffect);
  const setActiveEffect = useStore((state) => state.setActiveEffect);
  const buyBackground = useStore((state) => state.buyBackground);
  const setActiveBackground = useStore((state) => state.setActiveBackground);
  const buyBoost = useStore((state) => state.buyBoost);
  const isBoostActive = useStore((state) => state.isBoostActive);
  const addToast = useStore((state) => state.addToast);
  const [tab, setTab] = useState('packs');

  const buyPack = (pack) => {
    if (!spendCoins(pack.price_coins)) {
      addToast('Недостаточно монет для покупки пака.', 'error');
      return;
    }
    addToast(`${pack.name} пак куплен!`, 'success');
    window.dispatchEvent(new CustomEvent('open-pack', { detail: { packId: pack.id, alreadyPaid: true } }));
  };

  const handleBuyItem = (item) => {
    const result = buyItem(item);
    if (!result.ok) {
      addToast('Недостаточно монет для покупки.', 'error');
      return;
    }
    addToast(result.alreadyOwned ? 'Предмет надет ✓' : 'Покупка добавлена в инвентарь!', 'success');
  };

  const handleBuyEffect = (effect) => {
    const result = buyEffect(effect);
    if (!result.ok) {
      addToast('Недостаточно монет для покупки.', 'error');
      return;
    }
    if (result.alreadyOwned) {
      setActiveEffect(effect.id);
      addToast('Эффект активирован! ✨', 'success');
    } else {
      addToast('Эффект куплен и активирован! ✨', 'success');
    }
  };

  const handleBuyBackground = (bg) => {
    const result = buyBackground(bg);
    if (!result.ok) {
      addToast('Недостаточно монет для покупки.', 'error');
      return;
    }
    if (result.alreadyOwned) {
      setActiveBackground(bg.id);
      addToast('Фон выбран! 🖼️', 'success');
    } else {
      addToast('Фон куплен и активирован! 🖼️', 'success');
    }
  };

  const handleBuyBoost = (boost) => {
    const result = buyBoost(boost);
    if (!result.ok) {
      addToast('Недостаточно монет для покупки.', 'error');
      return;
    }
    if (result.alreadyActive) {
      addToast('Буст уже активен! Время увеличено ⏳', 'success');
    } else {
      addToast('Буст куплен и активирован! 🚀', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">Магазин гильдии</h1>
        <div className="mt-2 flex justify-center gap-2">
          <span className="pill">💰 {family?.coins || 0} монет</span>
          <span className="pill">💎 {family?.gems || 0} кристаллов</span>
        </div>
      </header>

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'packs', label: 'Паки' },
          { value: 'items', label: 'Предметы' },
          { value: 'effects', label: 'Эффекты' },
          { value: 'backgrounds', label: 'Фоны' },
          { value: 'boosts', label: 'Бусты' },
        ]}
      />

      {tab === 'packs' ? (
        <div className="packs-scroll md:grid md:grid-cols-3 md:gap-4">
          {PACK_TYPES.map((pack) => (
            <div key={pack.id} className="pack-card-scroll rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 text-center shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
              <div
                className="mx-auto mb-4 grid h-[100px] w-20 place-items-center rounded-[var(--r-md)] text-5xl"
                style={{ background: `linear-gradient(145deg, ${pack.color}, var(--sand-light))` }}
              >
                ⭐
              </div>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{pack.emoji} {pack.name}</h2>
              <p className="mb-4 min-h-[40px] text-sm font-medium text-[var(--text-secondary)]">
                {pack.cards} карты · {pack.guarantee}
              </p>
              <div className="mb-4 text-lg font-semibold text-[var(--sand)]">💰 {pack.price_coins}</div>
              <button type="button" className="btn-primary w-full px-4 py-2" onClick={() => buyPack(pack)}>
                Купить
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'items' ? (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SHOP_ITEMS.filter((item) => item.type !== 'boost').map((item) => {
            const owned = family?.ownedItems?.includes(item.id);
            const equipped = family?.equippedItems?.[item.type] === item.id;
            return (
              <div key={item.id} className="rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-4 text-center">
                <div className="mb-3 text-5xl">{item.emoji}</div>
                <h2 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{item.name}</h2>
                <div className="mb-3 text-sm font-medium text-[var(--sand)]">💰 {item.price}</div>
                <button
                  type="button"
                  className={`${owned ? 'btn-secondary' : 'btn-primary'} w-full px-3 py-2 text-xs`}
                  onClick={() => handleBuyItem(item)}
                >
                  {equipped ? 'Надето ✓' : owned ? 'Надеть' : 'Купить'}
                </button>
              </div>
            );
          })}
        </section>
      ) : null}

      {tab === 'effects' ? (
        <section className="grid gap-4 md:grid-cols-2">
          {EFFECT_TYPES.map((effect) => {
            const owned = family?.ownedEffects?.includes(effect.id);
            const active = family?.activeEffect === effect.id;
            return (
              <div key={effect.id} className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] flex items-center gap-4 p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
                <img
                  src={effect.icon}
                  alt={effect.name}
                  className="h-14 w-14 shrink-0 rounded-[var(--r-md)] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-[var(--text-primary)]">{effect.name}</h2>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">{effect.description}</p>
                </div>
                <button
                  type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-[var(--sage)] text-white'
                      : owned
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                        : 'btn-primary'
                  }`}
                  onClick={() => handleBuyEffect(effect)}
                >
                  {active ? 'Активен ✓' : owned ? 'Выбрать' : `💰 ${effect.price}`}
                </button>
              </div>
            );
          })}
        </section>
      ) : null}

      {tab === 'backgrounds' ? (
        <section className="grid gap-4 md:grid-cols-2">
          {BACKGROUND_TYPES.map((bg) => {
            const owned = family?.ownedBackgrounds?.includes(bg.id);
            const active = family?.activeBackground === bg.id;
            return (
              <div key={bg.id} className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] flex items-center gap-4 p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
                <img
                  src={bg.imageMini}
                  alt={bg.name}
                  className="h-14 w-14 shrink-0 rounded-[var(--r-md)] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-[var(--text-primary)]">{bg.name}</h2>
                </div>
                <button
                  type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-[var(--sage)] text-white'
                      : owned
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                        : 'btn-primary'
                  }`}
                  onClick={() => handleBuyBackground(bg)}
                >
                  {active ? 'Активен ✓' : owned ? 'Выбрать' : `💰 ${bg.price}`}
                </button>
              </div>
            );
          })}
        </section>
      ) : null}

      {tab === 'boosts' ? (
        <section className="grid gap-4 md:grid-cols-2">
          {BOOST_TYPES.map((boost) => {
            const active = isBoostActive(boost.id);
            return (
              <div key={boost.id} className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] flex items-center gap-4 p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
                <img
                  src={boost.icon}
                  alt={boost.name}
                  className="h-14 w-14 shrink-0 rounded-[var(--r-md)] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-[var(--text-primary)]">{boost.name}</h2>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Длительность: {boost.duration}</p>
                </div>
                <button
                  type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-[var(--sage)] text-white'
                      : 'btn-primary'
                  }`}
                  onClick={() => handleBuyBoost(boost)}
                >
                  {active ? 'Активен ✓' : `💰 ${boost.price}`}
                </button>
              </div>
            );
          })}
        </section>
      ) : null}
    </div>
  );
};
