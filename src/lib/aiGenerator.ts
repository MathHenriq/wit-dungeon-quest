const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'legendary';

export interface GenerationRequest {
  content: string;
  generateMissions: boolean;
  generateBoss: boolean;
  generateChallenges: boolean;
  generateSkillNodes: boolean;
  difficulty: Difficulty;
}

export interface GeneratedMission {
  title: string;
  description: string;
  reward: number;
}

export interface GeneratedBossQuestion {
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  damage: number;
}

export interface GeneratedBoss {
  title: string;
  boss_name: string;
  boss_hp: number;
  reward_coins: number;
  reward_xp: number;
  questions: GeneratedBossQuestion[];
}

export interface GeneratedChallenge {
  title: string;
  description: string;
  reward: number;
  challenge_type: 'simples' | 'unica';
}

export interface GeneratedSkillNode {
  name: string;
  description: string;
}

export interface GeneratedContent {
  missions?: GeneratedMission[];
  boss?: GeneratedBoss;
  challenges?: GeneratedChallenge[];
  skill_nodes?: GeneratedSkillNode[];
}

export function getApiKey(): string {
  return localStorage.getItem('anthropic_key') ?? '';
}

export function setApiKey(key: string): void {
  localStorage.setItem('anthropic_key', key);
}

export async function generateFromCurriculum(request: GenerationRequest): Promise<GeneratedContent> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key da Anthropic não configurada.');

  const systemPrompt = `Você é um assistente que gera conteúdo gamificado para uma plataforma educacional de IA chamada WIT Dungeon (estilo RPG/SAO).

Baseado no conteúdo da aula fornecido, gere APENAS um JSON válido (sem markdown, sem backticks, sem explicação) com a seguinte estrutura:

{
  "missions": [
    { "title": "Nome épico da missão", "description": "Descrição curta do que o aluno deve fazer", "reward": 15 }
  ],
  "boss": {
    "title": "Nome do conteúdo avaliado",
    "boss_name": "Nome épico do boss (ex: Dragão Neural)",
    "boss_hp": 100,
    "reward_coins": 20,
    "reward_xp": 50,
    "questions": [
      {
        "question_text": "Pergunta sobre o conteúdo",
        "question_type": "multiple_choice",
        "options": ["A) opção", "B) opção", "C) opção", "D) opção"],
        "correct_answer": "B",
        "damage": 10
      }
    ]
  },
  "challenges": [
    { "title": "Nome do desafio", "description": "O que fazer", "reward": 10, "challenge_type": "simples" }
  ],
  "skill_nodes": [
    { "name": "Nome do tópico", "description": "Descrição curta" }
  ]
}

Regras:
- Nomes de missões e bosses devem ser épicos/fantasia (estilo RPG)
- Perguntas devem ser sobre o conteúdo real da aula
- Dificuldade: ${request.difficulty}
- Recompensas escalam com dificuldade (easy: 10-15, normal: 15-25, hard: 25-40, legendary: 40-60)
- Boss deve ter entre 5-10 perguntas
- Soma dos danos das perguntas deve ser >= boss_hp
- Gere apenas as categorias solicitadas (omita as outras)
- Responda APENAS com o JSON, nada mais`;

  const whatToGenerate = [
    request.generateMissions && 'missões (3-5)',
    request.generateBoss && 'boss battle (1 boss com 5-10 perguntas)',
    request.generateChallenges && 'desafios rápidos (3-5)',
    request.generateSkillNodes && 'skill nodes (3-6 tópicos)',
  ].filter(Boolean).join(', ');

  const userMessage = `Conteúdo da aula:\n\n${request.content}\n\nGerar: ${whatToGenerate}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `Erro ${response.status} na API Anthropic`);
  }

  const data = await response.json() as { content?: { type: string; text: string }[] };
  const text = data.content?.[0]?.text ?? '';
  const clean = text.replace(/```json\n?|```\n?/g, '').trim();

  try {
    return JSON.parse(clean) as GeneratedContent;
  } catch {
    throw new Error('A IA retornou um formato inesperado. Tente novamente.');
  }
}
