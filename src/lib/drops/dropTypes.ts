export type DropRarity =
  | 'comum'
  | 'incomum'
  | 'raro'
  | 'epico'
  | 'lendario'
  | 'mitico'
  | '???';

export interface DropResult {
  dropItemId:    string;
  name:          string;
  rarity:        DropRarity;
  floorTheme:    string;
  baseSellValue: number;
  quantity:      number;
}

export const RARITY_LABEL: Record<DropRarity, string> = {
  comum:    'COMUM',
  incomum:  'INCOMUM',
  raro:     'RARO',
  epico:    'ÉPICO',
  lendario: 'LENDÁRIO',
  mitico:   'MÍTICO',
  '???':    '???',
};

export const RARITY_COLOR: Record<DropRarity, string> = {
  comum:    '#94a3b8',
  incomum:  '#22c55e',
  raro:     '#3b82f6',
  epico:    '#a855f7',
  lendario: '#f59e0b',
  mitico:   '#ef4444',
  '???':    'transparent',
};
