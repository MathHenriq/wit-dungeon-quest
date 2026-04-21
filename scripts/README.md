# Scripts de Geração de Andares — WIT Dungeon

## Pré-requisitos

Node.js 18+ e dependências:
```bash
npm install @supabase/supabase-js
npm install -D ts-node @types/node
```

---

## Configuração

### API Key do Gemini (Gratuita)
Pegue em: https://aistudio.google.com/apikey

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY             = "AIza..."
$env:SUPABASE_SERVICE_ROLE_KEY  = "eyJ..."
$env:TEACHER_ID                 = "uuid-do-seu-usuario"
```

**Mac / Linux:**
```bash
export GEMINI_API_KEY="AIza..."
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export TEACHER_ID="uuid-do-seu-usuario"
```

> `TEACHER_ID` = UUID do seu usuário no Supabase → **Authentication → Users**
> `SUPABASE_URL` já está embutido no script (`pvnzfiyxwvfmmhvpvrrk.supabase.co`)

---

## Fluxo completo

### 1. Colocar sprites nas pastas
```
public/assets/sprites/all/     ← sprites de inimigos (PNG/JPG)
public/assets/sprites/bosses/  ← sprites de bosses (opcional)
```

### 2. Escanear sprites
```bash
npm run sprites:scan
```
Gera `src/data/sprites-catalog.json` com nomes e elementos automáticos.

### 3. Gerar os 50 andares
```bash
npm run floors:generate
```

Para continuar de onde parou (ex: caiu no andar 23):
```bash
npm run floors:generate -- 23
```

### 4. Revisar os arquivos gerados
```
scripts/output/
├── floor_01.json  ...  floor_50.json   ← andares individuais
├── all_floors.json                     ← consolidado (usado no insert)
└── errors.json                         ← andares que falharam (se houver)
```

### 5. Rodar migração SQL
```bash
npm run db:migrate
```

### 6. Inserir no banco
```bash
npm run floors:insert
```

---

## Custos

| Item | Custo |
|---|---|
| Gemini 2.0 Flash API | **Gratuito** (1.500 req/dia) |
| Supabase | Gratuito (free tier) |
| **Total** | **R$ 0** |

**Limites do Gemini Free:**
- 15 requisições/minuto
- 1.500 requisições/dia
- 1M tokens/minuto

Para 50 andares usamos ~50 requisições — muito abaixo do limite.

**Tempo estimado:** ~4 minutos para os 50 andares (4,5 s entre cada chamada)

---

## Comandos disponíveis

| Comando | O que faz |
|---|---|
| `npm run sprites:scan` | Escaneia `public/assets/sprites/` e gera o catálogo |
| `npm run floors:generate` | Gera os 50 andares via Gemini API |
| `npm run floors:generate -- N` | Retoma a geração a partir do andar N |
| `npm run floors:insert` | Insere os andares gerados no Supabase |
| `npm run db:migrate` | Aplica a migração SQL no Supabase |
