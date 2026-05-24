// Patch 1.1 — "Uma Nova Era" welcome message
//
// Edit this file freely to tune the wording. The component
// `Patch11Welcome` consumes the structured pieces below so you
// can rewrite copy without touching the JSX.
//
// {refund} placeholder is filled at render time with the actual
// coin amount each student got back (250 or 850).

export const PATCH_1_1_CONTENT = {
  title:    'PATCH 1.1',
  subtitle: 'UMA NOVA ERA',

  /** Short hero line under the title — single sentence, dramatic. */
  hero:
    'O WIT Dungeon evoluiu. As regras do jogo foram reescritas do zero pra criar algo que valesse a sua jornada.',

  /** Mid-section paragraphs, ordered. Each becomes its own block in the modal. */
  paragraphs: [
    'Skills agora têm identidade real — cada uma é fiel ao universo que representa.',
    'Atributos finalmente fazem diferença em batalha.',
    'Baús, forja e eventos chegaram.',
    'Cartas Mítica e ??? são agora conquistas verdadeiras.',
  ],

  /**
   * Refund line. `{refund}` is replaced at render time.
   * Keep the placeholder exactly as `{refund}` (curly braces, no spaces).
   */
  refundLine:
    'Pra começarmos juntos nessa nova era, seu inventário foi reiniciado e você recebeu de volta {refund} moedas pelo que investiu.',

  /** Final line, just above the CTA. Use sparingly — closes the moment. */
  outro: 'A jornada recomeça agora.',

  /** Call-to-action button label. */
  cta: 'EXPLORAR A NOVA ERA',
} as const;

/** Helper: produces the final refund line with the placeholder filled in. */
export function formatRefundLine(refund: number): string {
  return PATCH_1_1_CONTENT.refundLine.replace('{refund}', String(refund));
}
