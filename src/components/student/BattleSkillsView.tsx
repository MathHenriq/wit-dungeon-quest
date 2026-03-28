import type { BattleCharacter } from '@/types/character';
import { SkillTree } from '@/components/battle/SkillTree';

interface BattleSkillsViewProps {
  character: BattleCharacter;
}

export function BattleSkillsView({ character }: BattleSkillsViewProps) {
  return (
    <div className="space-y-6">
      <SkillTree character={character} />
    </div>
  );
}
