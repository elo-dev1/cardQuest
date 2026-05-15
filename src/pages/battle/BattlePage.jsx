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
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const wasDefeatedRef = useRef(false);
  const prevHpRef = useRef(boss.hp);

  useEffect(() => {
    checkBossAttackNeeded();
  }, [checkBossAttackNeeded]);

  useEffect(() => {
    if (boss.hp !== prevHpRef.current && boss.hp === 0 && !wasDefeatedRef.current) {
      wasDefeatedRef.current = true;
      setShowVictory(true);
    }
    prevHpRef.current = boss.hp;
  }, [boss.hp]);

  useEffect(() => {
    if (boss.daysLeft === 0 && boss.hp > 0 && !wasDefeatedRef.current) {
      wasDefeatedRef.current = true;
      setShowDefeat(true);
    }
  }, [boss.daysLeft]);

  const handleVictoryClose = useCallback(() => {
    setShowVictory(false);
    wasDefeatedRef.current = false;
  }, []);

  const handleDefeatClose = useCallback(() => {
    setShowDefeat(false);
    wasDefeatedRef.current = false;
  }, []);

  return (
    <div className="space-y-5 pb-20">
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
            onClose={handleDefeatClose}
          />
        )}
      </AnimatePresence>

      <BossArena
        boss={boss}
        lastDamageEvent={lastDamageEvent}
      />

      <DeckZone onOpenBuilder={() => setDeckModal(true)} />

      <GuildProgress />

      <BattleLog />

      <div className="card p-4">
        <div className="flex items-center justify-between text-sm font-bold text-[var(--text-muted)]">
          <span>Очки гильдии</span>
          <span className="flex items-center gap-2">
            <span className="text-xl font-black text-purple-600">{guildPoints}</span>
            <span className="text-xs">очков</span>
          </span>
        </div>
      </div>

      <AnimatePresence>
        {deckModal && (
          <DeckBuilderModal onClose={() => setDeckModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
