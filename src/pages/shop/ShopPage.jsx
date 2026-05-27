import { useState, useMemo } from 'react';
import { PACK_TYPES, SHOP_ITEMS, EFFECT_TYPES, BACKGROUND_TYPES, BOOST_TYPES } from '@/shared/data/shopItems';
import { REAL_REWARDS, REWARD_CATEGORIES } from '@/shared/data/realRewards';
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
  const buyReward = useStore((state) => state.buyReward);
  const addToast = useStore((state) => state.addToast);
  const purchasedRewards = useStore((state) => state.purchasedRewards);
  const member = useStore((state) => state.getCurrentMember());
  const [tab, setTab] = useState('packs');
  const [rewardCategory, setRewardCategory] = useState('time');

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
      if (result.reason === 'level') {
        addToast('Требуется 3 уровень персонажа для покупки эффектов.', 'error');
      } else {
        addToast('Недостаточно монет для покупки.', 'error');
      }
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
      if (result.reason === 'level') {
        addToast('Требуется 7 уровень персонажа для покупки фонов.', 'error');
      } else {
        addToast('Недостаточно монет для покупки.', 'error');
      }
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
      if (result.reason === 'level') {
        addToast('Требуется 5 уровень персонажа для покупки бустов.', 'error');
      } else {
        addToast('Недостаточно монет для покупки.', 'error');
      }
      return;
    }
    if (result.alreadyActive) {
      addToast('Буст уже активен! Время увеличено ⏳', 'success');
    } else {
      addToast('Буст куплен и активирован! 🚀', 'success');
    }
  };

  const formatTimeLeft = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}д ${hours % 24}ч`;
    }
    return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
  };

  const cooldownMap = useMemo(() => {
    const map = {};
    const now = Date.now();
    for (const r of REAL_REWARDS) {
      const cat = REWARD_CATEGORIES.find((c) => c.value === r.category);
      const cooldownDays = cat?.cooldownDays;
      if (!cooldownDays) {
        const hasAny = purchasedRewards.some((pr) => pr.reward_id === r.id && pr.status === 'purchased');
        if (hasAny) map[r.id] = { onCooldown: true, timeLeft: null };
        continue;
      }
      const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
      const lastPurchase = purchasedRewards
        .filter((pr) => pr.reward_id === r.id && pr.status === 'purchased')
        .sort((a, b) => new Date(b.purchased_at) - new Date(a.purchased_at))[0];
      if (lastPurchase) {
        const elapsed = now - new Date(lastPurchase.purchased_at).getTime();
        if (elapsed < cooldownMs) {
          const left = cooldownMs - elapsed;
          map[r.id] = { onCooldown: true, timeLeft: left };
        }
      }
    }
    return map;
  }, [purchasedRewards]);

  const filteredRewards = useMemo(() => {
    return REAL_REWARDS.filter((r) => {
      if (r.category !== rewardCategory) return false;
      if (r.for_role === 'child' && member?.role !== 'child') return false;
      if (r.for_role === 'parent' && member?.role !== 'parent') return false;
      return true;
    });
  }, [rewardCategory, member]);

  const handleBuyReward = (reward) => {
    const cd = cooldownMap[reward.id];
    if (cd && cd.onCooldown) {
      if (cd.timeLeft !== null) {
        addToast(`Награду можно снова купить через ${formatTimeLeft(cd.timeLeft)}`, 'info');
      } else {
        addToast(`Награда «${reward.name}» уже куплена`, 'info');
      }
      return;
    }

    const result = buyReward(reward.id);
    if (!result.ok) {
      if (result.reason === 'guild_level') {
        addToast('Требуется 5 уровень гильдии для покупки наград.', 'error');
      } else if (result.reason === 'insufficient_coins') {
        addToast('Недостаточно монет!', 'error');
      } else if (result.reason === 'cooldown') {
        addToast(`Награду можно снова купить через ${result.remainingHours}ч`, 'info');
      }
      return;
    }

    if (result.earned) {
      addToast(`💼 Задание «${reward.name}» — заработано +${result.earned} монет`, 'success');
    } else if (result.free) {
      addToast(`⭐ Награда «${reward.name}» активирована!`, 'success');
    } else {
      addToast(`🎁 Награда «${reward.name}» куплена!`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">Магазин гильдии</h1>
        <div className="mt-2 flex justify-center gap-2">
          <span className="pill"><img src="/common/money.png" alt="" className="inline-block w-5 h-5 align-text-bottom" /> {family?.coins || 0} монет</span>
        </div>
      </header>

      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'packs', label: 'Паки' },
            { value: 'items', label: 'Предметы' },
            { value: 'effects', label: 'Эффекты' },
            { value: 'backgrounds', label: 'Фоны' },
            { value: 'boosts', label: 'Бусты' },
            { value: 'rewards', label: '🎁 Награды' },
          ]}
          className="flex-nowrap"
        />
      </div>

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
              <div className="mb-4 text-lg font-semibold text-[var(--sand)]"><img src="/common/money.png" alt="" className="inline-block w-5 h-5 align-text-bottom" /> {pack.price_coins}</div>
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
                <div className="mb-3 text-sm font-medium text-[var(--sand)]"><img src="/common/money.png" alt="" className="inline-block w-5 h-5 align-text-bottom" /> {item.price}</div>
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
            const levelLocked = (member?.level ?? 0) < 3;
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
                  disabled={levelLocked}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    levelLocked
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed'
                      : active
                        ? 'bg-[var(--sage)] text-white'
                        : owned
                          ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                          : 'btn-primary'
                  }`}
                  onClick={() => handleBuyEffect(effect)}
                >
                  {levelLocked ? '🔒 ур. 3' : active ? 'Активен ✓' : owned ? 'Выбрать' : <><img src="/common/money.png" alt="" className="inline-block w-5 h-5 align-text-bottom" /> {effect.price}</>}
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
            const levelLocked = (member?.level ?? 0) < 7;
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
                  disabled={levelLocked}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    levelLocked
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed'
                      : active
                        ? 'bg-[var(--sage)] text-white'
                        : owned
                          ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                          : 'btn-primary'
                  }`}
                  onClick={() => handleBuyBackground(bg)}
                >
                  {levelLocked ? '🔒 ур. 7' : active ? 'Активен ✓' : owned ? 'Выбрать' : <><img src="/common/money.png" alt="" className="inline-block w-5 h-5 align-text-bottom" /> {bg.price}</>}
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
            const levelLocked = (member?.level ?? 0) < 5;
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
                  disabled={levelLocked}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    levelLocked
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed'
                      : active
                        ? 'bg-[var(--sage)] text-white'
                        : 'btn-primary'
                  }`}
                  onClick={() => handleBuyBoost(boost)}
                >
                  {levelLocked ? '🔒 ур. 5' : active ? 'Активен ✓' : <><img src="/common/money.png" alt="" className="inline-block w-5 h-5 align-text-bottom" /> {boost.price}</>}
                </button>
              </div>
            );
          })}
        </section>
      ) : null}

      {tab === 'rewards' ? (
        <div className="space-y-5">
          {(family?.guild_level ?? 1) < 5 && (
            <div className="rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-3 text-center text-sm font-medium text-[var(--text-tertiary)]">
              🔒 Требуется 5 уровень гильдии для покупки наград
            </div>
          )}
          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <SegmentedControl
              options={REWARD_CATEGORIES}
              value={rewardCategory}
              onChange={setRewardCategory}
              className="flex-nowrap"
            />
          </div>
          <section className="space-y-2">
            {filteredRewards.map((reward) => {
              const cd = cooldownMap[reward.id];
              const onCooldown = cd?.onCooldown;
              const guildLocked = (family?.guild_level ?? 1) < 5;
              const shouldDisable = onCooldown || guildLocked;
              return (
                <div
                  key={reward.id}
                  className={`flex items-center gap-3 rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] border ${shouldDisable ? 'border-[var(--sage)] opacity-60' : 'border-[var(--border-soft)]'}`}
                >
                  <span className="text-2xl">{reward.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{reward.name}</div>
                    <div className="text-xs font-medium text-[var(--text-secondary)] leading-snug">{reward.description}</div>
                  </div>
                  <button
                    type="button"
                    className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap ${shouldDisable ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-default' : 'btn-primary'}`}
                    onClick={() => handleBuyReward(reward)}
                    disabled={shouldDisable}
                  >
                    {guildLocked ? '🔒 ур. гильдии 5' : onCooldown && cd.timeLeft !== null
                      ? formatTimeLeft(cd.timeLeft)
                      : onCooldown
                        ? 'Куплено ✓'
                        : reward.price < 0
                          ? `+${Math.abs(reward.price)}💰`
                          : reward.price === 0
                            ? 'Бесплатно'
                            : `${reward.price}💰`}
                  </button>
                </div>
              );
            })}
            {filteredRewards.length === 0 && (
              <p className="py-12 text-center text-sm font-medium text-[var(--text-tertiary)]">Нет наград в этой категории</p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};
