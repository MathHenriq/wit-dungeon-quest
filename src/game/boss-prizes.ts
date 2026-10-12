// Prêmios exclusivos dos chefes (plano §3.2: chefes têm peças que o aluno
// ganha ao derrotá-los). A cada 10 andares, vencer o chefe pela primeira vez
// dá um acessório que não está em nenhuma loja. Os outros acessórios são livres.
export const BOSS_PRIZES: Record<number, string> = {
  10: 'coroa',
  20: 'oculos-aviador',
  30: 'orelhas-gato',
  40: 'coroa-flores',
  50: 'fone',
};

const LOCKED = new Map(Object.entries(BOSS_PRIZES).map(([andar, id]) => [id, Number(andar)]));

/** Prêmio do chefe deste andar (ou nada). */
export const prizeFor = (andar: number): string | undefined => BOSS_PRIZES[andar];

/** Andar do chefe que dá este acessório (undefined = acessório livre). */
export const prizeFloor = (acc: string): number | undefined => LOCKED.get(acc);

/** O aluno pode usar o acessório? Livre ou já ganho. */
export const canWear = (acc: string, premios: string[]): boolean => !LOCKED.has(acc) || premios.includes(acc);
