import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@/shared/store/useStore';
import { BossArena } from './BossArena';
import { DeckZone } from './DeckZone';
import { DeckBuilderModal } from './DeckBuilderModal';
import { GuildProgress } from './GuildProgress';
import { BattleLog } from './BattleLog';
import { VictoryScreen, DefeatScreen } from './BattleScreens';

export const BattlePage = () => {
  const boss = useStore((state) => state.boss);
  const guildPoints = useStore((state) => state.guildPoints);
  const checkBossAttackNeeded = useStore((state) => state.checkBossAttackNeeded);
  const lastDamageEvent = useStore((state) => state.lastDamageEvent);

  const [deckModal, setDeckModal] = useState(false);
  const [deckSlot, setDeckSlot] = useState(undefined);
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const prevHpRef = useRef(boss.hp);

  useEffect(() => {
    checkBossAttackNeeded();
  }, [checkBossAttackNeeded]);

  useEffect(() => {
    if (boss.hp !== prevHpRef.current && boss.hp === 0) {
      setShowVictory(true);
    }
    prevHpRef.current = boss.hp;
  }, [boss.hp]);

  useEffect(() => {
    if (boss.daysLeft === 0 && boss.hp > 0 && boss.id) {
      const key = `boss-defeat-${boss.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'true');
        setShowDefeat(true);
      }
    }
  }, [boss.daysLeft, boss.hp, boss.id]);

  const handleVictoryClose = useCallback(() => {
    setShowVictory(false);
  }, []);

  const handleDefeatClose = useCallback(() => {
    setShowDefeat(false);
  }, []);

  return (
    <div className="space-y-5 pb-20 -mt-3 md:mt-0">
      <AnimatePresence>
        {showVictory && (
          <VictoryScreen
            bossName={boss.name}
            reward={250}
            onClose={handleVictoryClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDefeat && (
          <DefeatScreen
            bossName={boss.name}
            bossEmoji={boss.emoji}
            onClose={handleDefeatClose}
          />
        )}
      </AnimatePresence>

      <BossArena
        boss={boss}
        lastDamageEvent={lastDamageEvent}
      />

      <DeckZone onOpenBuilder={(slot) => { setDeckSlot(slot); setDeckModal(true); }} />

      <GuildProgress />

      <BattleLog />

      <div className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between text-sm font-medium text-[var(--text-secondary)]">
          <span>Очки гильдии</span>
          <span className="flex items-center gap-2">
            <span className="font-['DM_Serif_Display'] text-xl text-[var(--lavender)]">{guildPoints}</span>
            <span className="text-xs">очков</span>
          </span>
        </div>
      </div>

      {deckModal && (
        <DeckBuilderModal
          onClose={() => { setDeckModal(false); setDeckSlot(undefined); }}
          initialSlot={deckSlot}
        />
      )}
    </div>
  );
};
