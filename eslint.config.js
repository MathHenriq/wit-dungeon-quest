import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },

  // ── Código da aplicação ────────────────────────────────────────────────
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",

      // Desligada de propósito: o projeto colocaliza constantes, tipos e
      // helpers no mesmo arquivo do componente em praticamente toda tela.
      // A regra apontava 54 ocorrências desse padrão, o que afeta só a
      // granularidade do hot reload em desenvolvimento — nenhuma delas é
      // defeito. Mantê-la ligada só escondia os avisos que importam.
      "react-refresh/only-export-components": "off",
    },
  },

  // ── Scripts de geração (rodados à mão, fora do build) ──────────────────
  // Não entram no bundle nem no tsconfig.app.json, e consomem catálogos JSON
  // sem schema. Exigir tipagem completa aqui seria inventar tipos para dados
  // de uso único; as regras que pegam defeito de verdade continuam ligadas.
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["scripts/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // ── Configuração de build ──────────────────────────────────────────────
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["*.config.{ts,js}", "vite.config.ts", "vitest.config.ts", "tailwind.config.ts"],
    languageOptions: { ecmaVersion: 2020, globals: globals.node },
  },
);
