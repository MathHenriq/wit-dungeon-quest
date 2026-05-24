import { useQuery } from '@tanstack/react-query';
import { getUnlockedSkillIds } from '@/lib/skills/api';

export function useUnlockedSkills(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ['skills', 'unlocked', studentId],
    enabled:  !!studentId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<string[]> => {
      return getUnlockedSkillIds(studentId!);
    },
  });
}
