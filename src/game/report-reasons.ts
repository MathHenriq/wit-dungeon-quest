// Motivos da denúncia (cartão de perfil no jogo; aba Denúncias do painel do professor).
export const REPORT_REASONS = [
  { id: 'apelido', label: 'Apelido feio' },
  { id: 'balao', label: 'Atrapalhando com o balão' },
  { id: 'troca', label: 'Troca injusta' },
  { id: 'outro', label: 'Outra coisa' },
] as const;
export type ReportReason = typeof REPORT_REASONS[number]['id'];
