import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Split the heavy third-party libraries into their own chunks.
 *
 * Before this, a single 1.39 MB entry chunk held React, GSAP, framer-motion,
 * Supabase, Recharts and three.js together, so every student re-downloaded all
 * of it whenever any one of them changed. Splitting by library means a deploy
 * that only touches app code leaves the vendor chunks in the browser cache, and
 * the ones a given screen never needs (three.js after the intro) are simply
 * never fetched.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ LEIA ANTES DE ADICIONAR UMA DIVISAO AQUI                                │
 * │                                                                         │
 * │ Dividir chunk errado NAO quebra o build — quebra o app em branco, no    │
 * │ navegador do aluno. O Rollup nao avisa: ele aceita ciclo entre chunks,  │
 * │ e o erro (`Cannot access 'X' before initialization`) so acontece quando │
 * │ o navegador executa um chunk antes do outro ter inicializado o binding  │
 * │ que ele le. Foi exatamente o que aconteceu com `vendor-charts`: o app   │
 * │ subiu em branco e o build seguiu verde o tempo todo.                    │
 * │                                                                         │
 * │ Por isso existe `npm run test:build`, que faz o build e ABRE a pagina   │
 * │ num navegador de verdade. Rode depois de mexer neste arquivo.           │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
function vendorChunk(id: string): string | undefined {
  // skillsRegistry.ts sao 15.574 linhas de dados estaticos (156 skills x 12
  // variantes de classe): 370 kB crus, 20 kB gzip. Separando num chunk proprio,
  // ele para de ser reempacotado junto do BattleScreen — que caiu de 574 kB
  // para 211 kB — entao uma mudanca no codigo de batalha nao invalida mais o
  // cache dessa tabela, que praticamente nunca muda.
  if (id.includes("skillsRegistry")) return "skills-registry";
  if (!id.includes("node_modules")) return;
  // React and its renderer must stay in one chunk or the runtime breaks.
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return "vendor-react";
  if (/[\\/]node_modules[\\/](three|@react-three)[\\/]/.test(id)) return "vendor-three";
  if (/[\\/]node_modules[\\/](gsap|@gsap)[\\/]/.test(id)) return "vendor-gsap";
  if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return "vendor-motion";
  if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return "vendor-supabase";
  if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return "vendor-query";
  if (/[\\/]node_modules[\\/](@radix-ui|cmdk|vaul|embla-carousel[a-z-]*)[\\/]/.test(id)) return "vendor-radix";
  if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return "vendor-icons";

  // Recharts NAO e dividido, de proposito. Ele foi a causa da tela branca:
  // sozinho o chunk funcionava, mas junto com os outros o grafo de chunks
  // fechava um ciclo e o navegador avaliava `vendor-charts` antes do chunk que
  // ele le estar inicializado. Verificado no navegador, uma divisao por vez.
  // Recharts so aparece nas telas do professor, que ja sao rotas lazy — deixar
  // o Rollup agrupa-lo com quem o importa nao muda nada para o aluno.

  // Sem catch-all `return "vendor"`, tambem de proposito: ele forcava todo
  // pacote nao listado num chunk so, e bastava um membro da familia de um
  // chunk nomeado cair nele para fechar o mesmo tipo de ciclo. Devolvendo
  // undefined, o Rollup agrupa o resto pela analise de dependencia dele, que
  // por construcao nao cria ciclo entre chunks.
  return undefined;
}

export default defineConfig({
  server: {
    host: "::",
    port: Number(process.env.PORT) || 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // The battle screen legitimately sits near 700 kB; warn only past that so
    // the signal stays meaningful instead of firing on every build.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
});
