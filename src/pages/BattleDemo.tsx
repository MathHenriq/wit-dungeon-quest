import { BattleScreen } from '@/components/battle/BattleScreen';
import type { BattleCharacter, Ability } from '@/types/character';
import type { BattleEnemy } from '@/lib/battle';

// ── Mock data ────────────────────────────────────────────────────────────────

const mockPlayer: BattleCharacter = {
  id: 'demo-player',
  userId: 'demo',
  name: 'MATHEUS',
  class: 'Guerreiro',
  level: 5,
  xp: 120,
  hpCurrent: 145,
  hpMax: 150,
  energyMax: 80,
  forca: 18,
  inteligencia: 10,
  destreza: 12,
  carisma: 8,
  agilidade: 14,
  resistencia: 16,
  ptsFire: 3, ptsWater: 0, ptsElectric: 2, ptsGrass: 0,
  ptsIce: 0, ptsGround: 1, ptsFighting: 5, ptsSteel: 0,
  ptsPoison: 0, ptsDark: 0, ptsGhost: 0, ptsFlying: 0,
  freePoints: 2,
  spritePixelFront: null,
  spritePixelBack: null,
  spritePixelAttack: null,
};

const mockEnemy: BattleEnemy = {
  id: 'demo-enemy',
  name: 'Guardião das Sombras',
  level: 8,
  hpCurrent: 220,
  hpMax: 220,
  defFisica: 12,
  defMagica: 8,
  velocidade: 10,
  elementType: 'Dark',
  abilities: [],
  isBoss: true,
  spriteUrl: undefined,
};

const mockAbilities: Ability[] = [
  {
    id: 'a1', name: 'Golpe de Fogo', elementId: 1, elementName: 'Fire',
    tier: 1, damageType: 'Physical', baseDamage: 45, energyCost: 20,
    accuracy: 90, requirement: 3, description: 'Ataque físico com chamas',
  },
  {
    id: 'a2', name: 'Raio Elétrico', elementId: 3, elementName: 'Electric',
    tier: 2, damageType: 'Special', baseDamage: 55, energyCost: 30,
    accuracy: 85, requirement: 2, description: 'Descarga elétrica poderosa',
  },
  {
    id: 'a3', name: 'Soco de Aço', elementId: 8, elementName: 'Steel',
    tier: 1, damageType: 'Physical', baseDamage: 40, energyCost: 15,
    accuracy: 95, requirement: 1, description: 'Soco revestido de metal',
  },
  {
    id: 'a4', name: 'Veneno Letal', elementId: 9, elementName: 'Poison',
    tier: 2, damageType: 'Status', baseDamage: 0, energyCost: 25,
    accuracy: 80, requirement: 2, description: 'Aplica envenenamento',
    effectType: 'poison', effectChance: 80, effectValue: null,
  },
];

// ── Demo page ─────────────────────────────────────────────────────────────────

export default function BattleDemo() {
  return (
    <div style={{ background: '#020611', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
      <div style={{ width: '100%', maxWidth: 900 }}>
        <BattleScreen
          player={mockPlayer}
          enemy={mockEnemy}
          equippedAbilities={mockAbilities}
          onVictory={(xp, coins) => console.log('Victory! XP:', xp, 'Coins:', coins)}
          onDefeat={() => console.log('Defeat!')}
          onFled={() => console.log('Fled!')}
        />
      </div>
    </div>
  );
}
