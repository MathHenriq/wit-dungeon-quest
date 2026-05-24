import { useQuery } from '@tanstack/react-query';
import { getClassProfile, type ClassProfile } from '@/lib/skills/api';

export function useClassProfile(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ['skills', 'classProfile', studentId],
    enabled:  !!studentId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ClassProfile | null> => {
      return getClassProfile(studentId!);
    },
  });
}
