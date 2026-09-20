import { useEffect, useState } from 'react';

/**
 * Fundo das telas de login (aluno e professor).
 *
 * O vídeo `/videos/login-bg.mp4` tem 10,4 MB e é renderizado com
 * `blur(14px) brightness(0.55)` — ou seja, um borrão escuro. Sem atributo
 * `preload` o navegador baixava o arquivo inteiro, e numa turma de 30 alunos
 * logando ao mesmo tempo isso são ~310 MB no exato momento em que todo mundo
 * precisa da rede. O CSS `.login-video-background` já desenha uma aurora
 * animada por baixo, que é o que aparece enquanto o vídeo não chega.
 *
 * Então: a aurora é o fundo padrão e o vídeo é um bônus que só entra quando a
 * conexão aguenta. Quem está no 4G do celular, com economia de dados ligada ou
 * com "reduzir movimento" no sistema simplesmente nunca baixa os 10 MB.
 */

/** Campos do Network Information API — ainda não estão no lib.dom padrão. */
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

function conexaoAguentaVideo(): boolean {
  if (typeof navigator === 'undefined') return false;

  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && conn.effectiveType !== '4g') return false;

  if (typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  return true;
}

export function LoginBackdrop() {
  const [tocarVideo, setTocarVideo] = useState(false);

  useEffect(() => {
    if (!conexaoAguentaVideo()) return;

    // Espera a página ficar ociosa: o formulário de login e a chamada de auth
    // têm prioridade sobre um enfeite borrado.
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(() => setTocarVideo(true), { timeout: 4000 });
    } else {
      timeoutId = setTimeout(() => setTocarVideo(true), 1500);
    }

    return () => {
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {/* Aurora CSS — é o fundo de verdade, não um placeholder. */}
      <div className="login-video-background" aria-hidden="true" />

      {tocarVideo && (
        <video
          className="fixed inset-0 w-full h-full object-cover z-0"
          style={{ filter: 'blur(14px) brightness(0.55)' }}
          src="/videos/login-bg.mp4"
          // preload="none" é o que impede o download antecipado; o play só
          // começa depois que o elemento é montado, já em idle.
          preload="none"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
      )}

      <div className="fixed inset-0 z-0 bg-black/40" aria-hidden="true" />
    </>
  );
}
