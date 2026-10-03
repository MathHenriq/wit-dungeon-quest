// Cenário do minijogo: uma faixa da sala de trabalho (parede, piso e móveis
// de verdade do atlas dos interiores, arte do GPT), em cima do jogo. Cada
// profissão tem a sua (padaria com fogão e vitrine, estúdio com caixas de som,
// laboratório com computadores...).
import { useEffect, useRef, type CSSProperties } from 'react';
import type { ProfId } from '@/game/professions';
import { loadAtlas, loadInteriorManifest, cut } from '@/components/city/interior-atlas';

interface SceneDef { parede: string; piso: string; props: [string, number][]; tint?: string }
/** Móveis de cada lugar: [sprite, x (px do mundo, a faixa tem 200 de largura)]. */
export const SCENES: Record<ProfId, SceneDef> = {
  padeiro: { parede: 'parede-casa-parede-2', piso: 'piso-casa-piso-3', props: [['prateleira-potes', 6], ['geladeira', 34], ['fogao-panela', 58], ['pia', 92], ['balcao-cafe', 124], ['vitrine-doces', 166]] },
  musico: { parede: 'parede-arena-parede-2', piso: 'piso-arena-piso-2', props: [['caixa-som', 4], ['toca-discos', 30], ['violao', 66], ['vitrola', 86], ['painel-led', 116], ['caixa-som', 176]] },
  artista: { parede: 'parede-casa-parede-3', piso: 'piso-casa-piso', props: [['cavalete', 8], ['quadro-criatura', 34], ['cavalete', 64], ['planta-pendurada', 90], ['quadro-familia', 112], ['cavalete', 142], ['vaso-tulipas', 170]] },
  'treinador-ia': { parede: 'parede-arena-parede-1', piso: 'piso-arena-piso-1', props: [['pc-gamer', 4], ['robo-aspirador', 52], ['mesa-streamer', 76], ['painel-led', 124], ['pc-gamer', 154]] },
  'tecnico-iot': { parede: 'parede-arena-parede-1', piso: 'piso-loja-piso', props: [['bancada', 6], ['luminaria-chao', 42], ['pc-gamer', 62], ['robo-aspirador', 110], ['bancada', 134], ['lampada-lava', 172]] },
  'arquiteto-meta': { parede: 'parede-arena-parede-2', piso: 'piso-arena-piso-1', props: [['orbe-luz', 8], ['pilar-cristal', 36], ['mesa-streamer', 62], ['painel-led', 110], ['pilar-cristal', 146], ['orbe-luz', 176]] },
  reporter: { parede: 'parede-oficina-parede', piso: 'piso-oficina-piso', props: [['estante', 4], ['escrivaninha', 36], ['mural-cortica', 78], ['tv-rack', 112], ['estante', 156]] },
  'dev-games': { parede: 'parede-arena-parede-2', piso: 'piso-casa-piso-4', props: [['fliperama', 4], ['estante-jogos', 30], ['mesa-streamer', 64], ['painel-led', 112], ['fliperama', 148], ['fliperama', 172]] },
  comerciante: { parede: 'parede-loja-parede', piso: 'piso-loja-piso', props: [['prateleira-comum', 4], ['cesto-pacotinhos', 38], ['balcao-troca', 74], ['prateleira-rara', 118], ['vitrine-cartas', 152]] },
  fazendeiro: { parede: 'parede-oficina-parede', piso: 'piso-oficina-piso', props: [['horta', 6], ['fruteira', 44], ['casinha-passaro', 72], ['horta', 100], ['vaso-tulipas', 138], ['horta', 160]] },
  entregador: { parede: 'parede-loja-parede', piso: 'piso-loja-piso', props: [['cesto-pacotinhos', 6], ['prateleira-comum', 42], ['balcao-troca', 74], ['cesto-pacotinhos', 120], ['mapa-loja', 158]] },
  pescador: { parede: 'parede-casa-parede', piso: 'piso-casa-piso-2', props: [['aquario', 10], ['estante', 56], ['quadro-criatura', 92], ['aquario', 130]] },
};

const W = 200, H = 60, WALL = 38;

export function Scene({ prof, height = 96 }: { prof: ProfId; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    const def = SCENES[prof];
    Promise.all([loadInteriorManifest(), loadAtlas()]).then(([m, atlas]) => {
      const c = ref.current;
      if (!alive || !c) return;
      const R = 2;
      c.width = W * R; c.height = H * R;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      // parede (repete na largura) e piso (repete embaixo)
      const wall = cut(m, atlas, def.parede), floor = cut(m, atlas, def.piso);
      if (floor) for (let x = 0; x < c.width; x += floor.width) for (let y = WALL * R - 8; y < c.height; y += floor.height) ctx.drawImage(floor, x, y);
      if (wall) for (let x = 0; x < c.width; x += wall.width) ctx.drawImage(wall, 0, 0, wall.width, wall.height, x, 0, wall.width, WALL * R);
      // rodapé
      ctx.fillStyle = 'rgba(40,24,12,.55)'; ctx.fillRect(0, WALL * R - 2, c.width, 4);
      // móveis: os da parede penduram no alto, os do chão apoiam na linha de baixo
      for (const [id, x] of def.props) {
        const s = cut(m, atlas, id), e = m[id];
        if (!s || !e) continue;
        const y = e.camada === 'p' ? 4 : (H - 3) * R - s.height;
        ctx.drawImage(s, x * R, Math.max(0, y));
      }
      // sombra embaixo para separar do jogo
      const g = ctx.createLinearGradient(0, c.height - 14, 0, c.height);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
      ctx.fillStyle = g; ctx.fillRect(0, c.height - 14, c.width, 14);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [prof]);
  return <canvas ref={ref} className="gs-scene" style={{ height, imageRendering: 'pixelated' }} />;
}

/** Um móvel do atlas desenhado em escala inteira (nítido), para os minijogos. */
export function Prop({ id, scale = 2, className = '', style }: { id: string; scale?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([loadInteriorManifest(), loadAtlas()]).then(([m, atlas]) => {
      const c = ref.current, s = cut(m, atlas, id);
      if (!alive || !c || !s) return;
      c.width = s.width; c.height = s.height;
      c.getContext('2d')!.drawImage(s, 0, 0);
      c.style.width = `${(s.width / 2) * scale}px`; c.style.height = `${(s.height / 2) * scale}px`;
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [id, scale]);
  return <canvas ref={ref} className={className} style={{ imageRendering: 'pixelated', ...style }} />;
}
