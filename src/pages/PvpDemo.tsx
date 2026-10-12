// Teste do PvP online sem servidor: duas abas do mesmo navegador
// (/pvp-demo?lado=host e /pvp-demo?lado=guest) trocam as jogadas por um
// BroadcastChannel no lugar do Supabase Realtime. Mesma partida, mesmo
// DuelView; serve para ver o protocolo funcionando (prints e testes).
import { useMemo, useState } from 'react';
import { DuelView, type RemoteDuel } from '@/components/duel/DuelView';
import { buildMatch, validDeck, type PvpAction, type PvpStart } from '@/game/pvp-online';
import { starterDeck } from '@/lib/tcg/opponents';
import { pathDeck } from '@/lib/tcg/paths';
import { DEFAULT_LOOK } from '@/game/world/outfit';

const START: PvpStart = {
  key: 'demo', seed: 4242, first: 0,
  host: { tab: 'a', nick: 'Ana', look: DEFAULT_LOOK, deck: starterDeck().map(c => c.id) },
  guest: { tab: 'b', nick: 'Beto', look: DEFAULT_LOOK, deck: pathDeck('louco').map(c => c.id) },
};

export default function PvpDemo() {
  const host = new URLSearchParams(window.location.search).get('lado') !== 'guest';
  const [end, setEnd] = useState<boolean | null>(null);
  const remote = useMemo<RemoteDuel>(() => {
    const bc = new BroadcastChannel('wit2-pvp-demo');
    const mine: PvpAction[] = [];
    return {
      initial: buildMatch(START, host)!,
      send: a => { mine.push(a); bc.postMessage({ from: host ? 'a' : 'b', n: mine.length - 1, a }); },
      subscribe: fn => {
        const h = (e: MessageEvent) => { if (e.data.from !== (host ? 'a' : 'b')) fn(e.data.a as PvpAction); };
        bc.addEventListener('message', h);
        return () => bc.removeEventListener('message', h);
      },
    };
  }, [host]);
  const other = host ? START.guest : START.host;
  const me = host ? START.host : START.guest;
  const deck = validDeck(other.deck)!;
  return (
    <div className="fixed inset-0 bg-black">
      <DuelView remote={remote} foeSprite="npc-desafiante-07" deck={validDeck(me.deck)!} look={DEFAULT_LOOK} nick={me.nick}
        foe={{ id: 'online-demo', name: other.nick, kind: 'mesa', andar: 1, element: deck[0].element, life: 150, ai: 3, deck, coins: 0 }}
        onEnd={won => setEnd(won)} onQuit={() => undefined}
        result={end !== null && <div className="absolute inset-0 flex items-center justify-center text-white text-2xl bg-black/60">{end ? 'VITÓRIA' : 'DERROTA'}</div>} />
    </div>
  );
}
