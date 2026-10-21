// Entrada do aluno no WIT 2 (/wit2): a cidade só abre depois de carregar do
// banco (cloud-boot.ts) e, daí em diante, tudo o que ele faz vai para lá.
//  * carregando: "Carregando seu progresso...";
//  * sem conexão: TENTAR DE NOVO (sem o banco nada abre: o progresso não se divide);
//  * suspenso ou sem login: avisa e volta para o portal;
//  * outro computador abriu o jogo (ou o professor zerou a conta): tapa a cidade
//    (esta janela já parou de gravar) e JOGAR AQUI assume de novo;
//  * selo no canto: SALVO / SALVANDO / SEM CONEXÃO.
import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { bootCloud } from '@/game/cloud-boot';
import { flush, watchSync, type SyncState } from '@/game/cloud';
import { PxButton } from '@/components/pixel/Pixel';

const CityDemo = lazy(() => import('@/pages/CityDemo'));
const pixel = "font-['Press_Start_2P',monospace]";

type Phase = 'carregando' | 'pronto' | 'erro' | 'suspenso' | 'sem-login';

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className={`fixed inset-0 z-[100] bg-[#1b2a22] flex flex-col items-center justify-center gap-4 px-4 text-center text-white/85 text-[10px] leading-relaxed ${pixel}`}>
      {children}
    </div>
  );
}

export function Wit2Gate({ studentId, playerName }: { studentId: string; playerName: string }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('carregando');
  const [sync, setSync] = useState<SyncState>('salvo');
  const start = useCallback(() => {
    setPhase('carregando');
    bootCloud(studentId).then(
      () => setPhase('pronto'),
      (e: unknown) => {
        console.error('banco', e);
        const m = e instanceof Error ? e.message : '';
        setPhase(m === 'suspenso' ? 'suspenso' : m === 'forbidden' ? 'sem-login' : 'erro');
      },
    );
  }, [studentId]);
  useEffect(() => { start(); }, [start]);
  useEffect(() => watchSync(setSync), []);
  // saiu do /wit2 sem fechar a aba: manda o que estiver esperando
  useEffect(() => () => { void flush(); }, []);
  const toPortal = () => navigate('/login', { replace: true });

  if (phase === 'carregando') return <Screen><span>Carregando seu progresso...</span></Screen>;
  if (phase === 'suspenso') {
    return <Screen><span>Sua conta está suspensa pelo professor.</span><PxButton onClick={toPortal}>VOLTAR</PxButton></Screen>;
  }
  if (phase === 'sem-login') {
    return <Screen><span>Entre de novo com seu login para jogar.</span><PxButton onClick={toPortal}>ENTRAR</PxButton></Screen>;
  }
  if (phase === 'erro') {
    return (
      <Screen>
        <span>Não deu para carregar seu progresso.</span>
        <span className="text-white/60 text-[8px] max-w-[420px]">Confira a internet e tente de novo. O jogo só abre com o progresso salvo no banco.</span>
        <PxButton big onClick={start}>TENTAR DE NOVO</PxButton>
      </Screen>
    );
  }
  return (
    <>
      <Suspense fallback={<Screen><span>carregando a cidade...</span></Screen>}>
        <CityDemo playerName={playerName} />
      </Suspense>
      <SaveBadge state={sync} />
      {sync === 'outra-sessao' && (
        <Screen>
          <span>Seu jogo foi aberto em outro lugar.</span>
          <span className="text-white/60 text-[8px] max-w-[420px]">Esta janela parou de salvar para não misturar o progresso. Para jogar aqui, toque abaixo: o outro lugar é que para.</span>
          <PxButton big onClick={() => window.location.reload()}>JOGAR AQUI</PxButton>
        </Screen>
      )}
    </>
  );
}

/** Selo pequeno de que o progresso está no banco. */
function SaveBadge({ state }: { state: SyncState }) {
  if (state === 'outra-sessao') return null;
  const text = state === 'salvo' ? 'SALVO' : state === 'salvando' ? 'SALVANDO...' : 'SEM CONEXÃO';
  const color = state === 'sem-rede' ? '#ff9a7a' : state === 'salvando' ? '#ffe08a' : '#9be0a6';
  return (
    <div className={`fixed left-1/2 -translate-x-1/2 bottom-1 z-[60] pointer-events-none rounded bg-black/55 px-2 py-1 text-[7px] ${pixel}`}
      style={{ color }} aria-live="polite">
      {text}
    </div>
  );
}
