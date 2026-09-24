/**
 * Regras de minimização de dados do aluno (nota do Ministério Público, set/2026).
 *
 * O sistema guarda do aluno apenas: e-mail (login), os DOIS primeiros nomes e
 * um nickname de personagem. Nada de nome completo, documento, escola ou turma
 * real. As mesmas regras são impostas no banco (constraints em `students`),
 * então esta validação existe para dar mensagem boa ao aluno — não é a única
 * barreira.
 */

// Letras (com acento), apóstrofo e hífen. Sem dígitos: nome não é lugar de RA.
const NAME_WORD = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'-]*$/;

// Partículas não contam como "nome" ("Maria de" não é um primeiro nome).
const PARTICLES = new Set(["da", "das", "de", "do", "dos", "e", "d'"]);

export const NAME_MAX_WORDS = 2;
export const NAME_WORD_MAX_LEN = 30;
export const NICKNAME_MIN_LEN = 3;
export const NICKNAME_MAX_LEN = 20;

export type ValidationResult = { value: string; error: string | null };

function collapseSpaces(s: string): string {
  return s.normalize("NFC").trim().replace(/\s+/g, " ");
}

/**
 * Valida os dois primeiros nomes do aluno. Recusa (em vez de cortar em
 * silêncio) quando há mais de dois nomes, para o aluno entender a regra.
 */
export function validateFirstNames(raw: string): ValidationResult {
  const value = collapseSpaces(raw);
  if (!value) return { value, error: "Informe seu primeiro nome." };

  const words = value.split(" ");
  if (words.length > NAME_MAX_WORDS) {
    return {
      value,
      error: "Use só os seus dois primeiros nomes (ex.: João Miguel). Não coloque sobrenome.",
    };
  }
  for (const w of words) {
    if (PARTICLES.has(w.toLowerCase())) {
      return { value, error: "Use só os seus dois primeiros nomes, sem \"de\", \"da\", \"dos\"." };
    }
    if (!NAME_WORD.test(w) || w.length > NAME_WORD_MAX_LEN) {
      return { value, error: "O nome deve ter só letras (sem números ou símbolos)." };
    }
  }
  return { value, error: null };
}

/**
 * Reduz um nome já existente aos dois primeiros nomes, pulando partículas.
 * Espelha `public.first_two_names()` no banco; usado onde um nome antigo
 * ainda possa chegar ao cliente.
 */
export function toFirstTwoNames(raw: string | null | undefined): string {
  if (!raw) return "";
  return collapseSpaces(raw)
    .split(" ")
    .filter((w) => !PARTICLES.has(w.toLowerCase()))
    .slice(0, NAME_MAX_WORDS)
    .join(" ");
}

/** Valida o nickname do personagem, que é o único nome visto por outros alunos. */
export function validateNickname(raw: string, firstNames?: string): ValidationResult {
  const value = collapseSpaces(raw);
  if (value.length < NICKNAME_MIN_LEN || value.length > NICKNAME_MAX_LEN) {
    return { value, error: `O nickname deve ter entre ${NICKNAME_MIN_LEN} e ${NICKNAME_MAX_LEN} caracteres.` };
  }
  // Mesma faixa de caracteres que o banco aceita (register_my_student).
  if (!/^[0-9A-Za-zÀ-ÖØ-öø-ÿ _.-]+$/.test(value)) {
    return { value, error: "O nickname só pode ter letras, números, espaço, _ . ou -." };
  }
  if (firstNames && value.toLowerCase() === collapseSpaces(firstNames).toLowerCase()) {
    return { value, error: "Escolha um nickname diferente do seu nome." };
  }
  return { value, error: null };
}

/**
 * Nome exibido de um aluno para OUTROS alunos (rankings, trocas, guildas,
 * PvP, feed). Nunca cai no nome real.
 */
export function publicDisplayName(student: { character_name?: string | null } | null | undefined): string {
  const nick = student?.character_name?.trim();
  return nick ? nick : "Aventureiro";
}
