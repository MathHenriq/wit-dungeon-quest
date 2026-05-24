import { useQuery } from '@tanstack/react-query';
import { getStudentAttributes, type AttributePoints } from '@/lib/skills/api';

export function useAttributes(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ['skills', 'attributes', studentId],
    enabled:  !!studentId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<AttributePoints> => {
      return getStudentAttributes(studentId!);
    },
  });
}
