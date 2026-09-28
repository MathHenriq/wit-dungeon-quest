// Entrada só da cidade (sem login nem Supabase), para gerar uma versão de
// teste que roda sozinha: npx vite build -c vite.demo.config.ts
import { createRoot } from 'react-dom/client';
import CityDemo from '@/pages/CityDemo';
import '@/index.css';

createRoot(document.getElementById('root')!).render(<CityDemo />);
