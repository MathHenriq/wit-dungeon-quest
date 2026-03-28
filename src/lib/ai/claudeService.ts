import { getApiKey } from '@/lib/aiGenerator';
import type { ElementType } from '@/types/character';

// ─── Re-export key helpers so consumers don't need to import aiGenerator ─────
export { getApiKey, setApiKey } from '@/lib/aiGenerator';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL             = 'claude-sonnet-4-20250514';

// ─── Request / response types ─────────────────────────────────────────────────

export interface GenerateFloorRequest {
  theme:    string;
  elements: ElementType[];
  levelMin: number;
  levelMax: number;
}

export interface GeneratedEnemy {
  name:       string;
  level:      number;
  lore:       string;
  hpMax:      number;
  defFisica:  number;
  defMagica:  number;
  velocidade: number;
  /** IDs of abilities — e.g. "fire_01", "water_07" */
  abilities:  string[];
}

export interface GeneratedBoss extends GeneratedEnemy {
  specialAbilityName:   string;
  specialAbilityEffect: string;
  specialTrigger:       string;
}

export interface GeneratedFloor {
  floorLore: string;
  enemies:   GeneratedEnemy[];
  boss:      GeneratedBoss;
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generateFloorWithAI(
  request: GenerateFloorRequest,
): Promise<GeneratedFloor> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Chave da API Anthropic não configurada.');

  // ── Prompts ─────────────────────────────────────────────────────────────────
  const systemPrompt =
    `Você é um game designer criando conteúdo para um RPG educacional chamado WIT Dungeon.
Gere stats balanceados para inimigos nível ${request.levelMin}-${request.levelMax}.
Boss deve ter HP 50% maior que inimigos normais e uma habilidade especial única.
Responda APENAS com JSON válido, sem markdown, sem backticks, sem explicação.`;

  // Build ability ID pool from requested elements
  const abilityPool = request.elements
    .map(el => {
      const prefix = el.toLowerCase();
      return Array.from({ length: 13 }, (_, i) =>
        `${prefix}_${String(i + 1).padStart(2, '0')}`,
      );
    })
    .flat()
    .join(', ');

  const hpGuide =
    request.levelMax <= 10  ? '100-200'  :
    request.levelMax <= 20  ? '200-400'  :
    request.levelMax <= 35  ? '400-800'  :
    request.levelMax <= 50  ? '800-1500' : '1500-3000';

  const userPrompt = `Tema: ${request.theme}
Elementos: ${request.elements.join(', ')}
Nível: ${request.levelMin}–${request.levelMax}
Habilidades disponíveis: ${abilityPool}

Crie um andar com:
- Lore do andar (2 parágrafos sobre o local e sua história)
- 5 inimigos normais com stats balanceados para o nível
- 1 boss com stats ~50% maiores e habilidade especial

Faixas de stats para nível ${request.levelMax}:
- hpMax: ${hpGuide}
- defFisica / defMagica: 20-80
- velocidade: 20-100

JSON esperado (EXATO, sem alterações de chave):
{
  "floorLore": "...",
  "enemies": [
    {
      "name": "Nome",
      "level": ${request.levelMin},
      "lore": "Uma frase sobre o inimigo.",
      "hpMax": 150,
      "defFisica": 30,
      "defMagica": 25,
      "velocidade": 40,
      "abilities": ["${request.elements[0]?.toLowerCase() ?? 'fire'}_01","${request.elements[0]?.toLowerCase() ?? 'fire'}_02","${request.elements[0]?.toLowerCase() ?? 'fire'}_03","${request.elements[0]?.toLowerCase() ?? 'fire'}_04"]
    }
  ],
  "boss": {
    "name": "Nome do Boss",
    "level": ${request.levelMax},
    "lore": "Uma frase sobre o boss.",
    "hpMax": 300,
    "defFisica": 50,
    "defMagica": 45,
    "velocidade": 55,
    "abilities": ["${request.elements[0]?.toLowerCase() ?? 'fire'}_05","${request.elements[0]?.toLowerCase() ?? 'fire'}_06","${request.elements[0]?.toLowerCase() ?? 'fire'}_07","${request.elements[0]?.toLowerCase() ?? 'fire'}_08"],
    "specialAbilityName": "Fúria do Boss",
    "specialAbilityEffect": "Aplica burn + defesa -20% por 2 turnos",
    "specialTrigger": "hp_below_50"
  }
}`;

  // ── API call ─────────────────────────────────────────────────────────────────
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'x-api-key':     apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 2000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message;
    throw new Error(msg ?? `Erro ${response.status} na API Anthropic`);
  }

  const data    = await response.json();
  const rawText: string = data.content?.[0]?.text ?? '';

  // Strip any accidental markdown fences
  const jsonStr = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/,      '')
    .replace(/```\s*$/,      '')
    .trim();

  const parsed = JSON.parse(jsonStr) as GeneratedFloor;

  // ── Basic validation ─────────────────────────────────────────────────────────
  if (!parsed.floorLore || !Array.isArray(parsed.enemies) || !parsed.boss) {
    throw new Error('Resposta da IA com estrutura inválida.');
  }
  if (parsed.enemies.length < 1) {
    throw new Error('A IA não gerou inimigos.');
  }

  return parsed;
}
