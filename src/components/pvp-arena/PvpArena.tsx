import React, { useState } from 'react';
import './pvp-arena.css';
import { ArenaHUD }   from './ArenaHUD';
import { ArenaHero }  from './ArenaHero';
import { ArenaTabs }  from './ArenaTabs';
import { ArenaTab }   from './ArenaTab';
import { RankingTab } from './RankingTab';
import { HistoryTab } from './HistoryTab';
import { BetModal }   from './BetModal';
import { QueueOverlay } from './QueueOverlay';
import type { ArenaTab as ArenaTabType, PvpProfile } from './pvp-types';
import { MOCK_SELF, MOCK_CLASSMATES, MOCK_HISTORY } from './pvp-types';

type QueueState = 'idle' | 'searching' | 'found';

interface PvpArenaProps {
  onBack: () => void;
}

export function PvpArena({ onBack }: PvpArenaProps) {
  const [activeTab,    setActiveTab]    = useState<ArenaTabType>('arena');
  const [queueState,   setQueueState]   = useState<QueueState>('idle');
  const [challenged,   setChallenged]   = useState<PvpProfile | null>(null);
  const [showBet,      setShowBet]      = useState(false);

  // Combine self with classmates for ranking
  const allPlayers = [MOCK_SELF, ...MOCK_CLASSMATES];

  const handleToggleQueue = () => {
    if (queueState === 'idle') {
      setQueueState('searching');
      // Simulate finding opponent after 5s (replace with Supabase Realtime later)
      setTimeout(() => setQueueState('found'), 5000);
    } else {
      setQueueState('idle');
    }
  };

  const handleChallenge = (player: PvpProfile) => {
    setChallenged(player);
    setShowBet(true);
  };

  const handleBetConfirm = (amount: number) => {
    console.log('Bet proposed:', amount, 'vs', challenged?.name);
    setShowBet(false);
    setChallenged(null);
    // TODO: Supabase Realtime — send challenge + bet to opponent
  };

  const handleBetSkip = () => {
    console.log('No bet — challenge sent to', challenged?.name);
    setShowBet(false);
    setChallenged(null);
    // TODO: Supabase Realtime — send challenge without bet
  };

  return (
    <div className="arena-root">
      <ArenaHUD
        profile={MOCK_SELF}
        onBack={onBack}
      />

      <ArenaHero
        profile={MOCK_SELF}
        queueState={queueState}
        onToggleQueue={handleToggleQueue}
      />

      <ArenaTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'arena' && (
        <ArenaTab classmates={MOCK_CLASSMATES} onChallenge={handleChallenge} />
      )}
      {activeTab === 'ranking' && (
        <RankingTab players={allPlayers} selfId={MOCK_SELF.student_id} />
      )}
      {activeTab === 'history' && (
        <HistoryTab history={MOCK_HISTORY} />
      )}

      {/* Modals */}
      {queueState === 'searching' && (
        <QueueOverlay onCancel={() => setQueueState('idle')} />
      )}

      {showBet && challenged && (
        <BetModal
          opponentName={challenged.name}
          playerCoins={MOCK_SELF.wins * 20}
          onConfirm={handleBetConfirm}
          onSkip={handleBetSkip}
        />
      )}
    </div>
  );
}
