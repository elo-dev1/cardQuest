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
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">Магазин гильдии</h1>
          <p className="text-sm font-bold text-white/50">Паки, предметы и временные усиления</p>
        </div>
        <div className="rounded-2xl bg-white/10 px-5 py-3 text-xl font-black text-white">
          💰 {family?.coins || 0} <span className="ml-3">💎 {family?.gems || 0}</span>
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
        <section className="grid gap-4 md:grid-cols-3">
          {PACK_TYPES.map((pack) => (
            <div key={pack.id} className="card p-5 text-center">
              <div
                className="mx-auto mb-4 grid h-[100px] w-20 place-items-center rounded-2xl text-5xl shadow-card"
                style={{ background: `linear-gradient(145deg, ${pack.color}, #f59e0b)` }}
              >
                ⭐
              </div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">{pack.emoji} {pack.name}</h2>
              <p className="mb-4 min-h-[40px] text-sm font-bold text-[var(--text-muted)]">
                {pack.cards} карты · {pack.guarantee}
              </p>
              <div className="mb-4 text-xl font-black text-[var(--c-gold)]">💰 {pack.price_coins}</div>
              <button type="button" className="btn-primary w-full px-4 py-2" onClick={() => buyPack(pack)}>
                Купить
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {tab === 'items' ? (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SHOP_ITEMS.filter((item) => item.type !== 'boost').map((item) => {
            const owned = family?.ownedItems?.includes(item.id);
            const equipped = family?.equippedItems?.[item.type] === item.id;
            return (
              <div key={item.id} className="rounded-[14px] bg-[#f8f7ff] p-4 text-center">
                <div className="mb-3 text-5xl">{item.emoji}</div>
                <h2 className="mb-1 text-sm font-black text-[var(--text-primary)]">{item.name}</h2>
                <div className="mb-3 text-sm font-black text-[var(--c-gold)]">💰 {item.price}</div>
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
              <div key={effect.id} className="card-dark flex items-center gap-4 p-5">
                <img
                  src={effect.icon}
                  alt={effect.name}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-card"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-white">{effect.name}</h2>
                  <p className="text-sm font-bold text-white/50">{effect.description}</p>
                </div>
                <button
                  type="button"
                  className={`shrink-0 px-4 py-2 text-sm font-black rounded-xl transition ${
                    active
                      ? 'bg-green-500 text-white'
                      : owned
                        ? 'bg-white/10 text-white hover:bg-white/20'
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
              <div key={bg.id} className="card-dark flex items-center gap-4 p-5">
                <img
                  src={bg.imageMini}
                  alt={bg.name}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-card"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-white">{bg.name}</h2>
                </div>
                <button
                  type="button"
                  className={`shrink-0 px-4 py-2 text-sm font-black rounded-xl transition ${
                    active
                      ? 'bg-green-500 text-white'
                      : owned
                        ? 'bg-white/10 text-white hover:bg-white/20'
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
              <div key={boost.id} className="card-dark flex items-center gap-4 p-5">
                <img
                  src={boost.icon}
                  alt={boost.name}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-card"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-white">{boost.name}</h2>
                  <p className="text-sm font-bold text-white/50">Длительность: {boost.duration}</p>
                </div>
                <button
                  type="button"
                  className={`shrink-0 px-4 py-2 text-sm font-black rounded-xl transition ${
                    active
                      ? 'bg-green-500 text-white'
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
