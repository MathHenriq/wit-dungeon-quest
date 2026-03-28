import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

/** Wrapper que aplica defaults anti-loop em todas as queries */
export function useOptimizedQuery<T>(options: UseQueryOptions<T, Error, T, any>) {
  return useQuery<T, Error, T, any>({
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
}
