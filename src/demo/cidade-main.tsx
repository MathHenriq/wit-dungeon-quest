// Entrada só da cidade (sem login nem Supabase), para gerar uma versão de
// teste que roda sozinha: npx vite build -c vite.demo.config.ts
// A arte das cartas vem em folhas (cards/atlas, gerado por
// scripts/arte/atlas-cartas.py), porque o link da demo tem limite de arquivos.
import { createRoot } from 'react-dom/client';
import CityDemo from '@/pages/CityDemo';
import { initCardAtlas } from '@/components/tcg/cardArt';
import '@/index.css';

initCardAtlas('cards/atlas').finally(() => {
  createRoot(document.getElementById('root')!).render(<CityDemo />);
});
