import { useQuery } from '@tanstack/react-query';
import { machineRepository } from '@/lib/db/machineRepository';
import { queryKeys } from './queryKeys';

export function useMachines() {
  return useQuery({
    queryKey: queryKeys.machines,
    queryFn: () => machineRepository.syncSeeds(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
