import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePlayLogInput, UpdatePlayLogInput } from '@/domain';
import { playLogRepository } from '@/lib/db/playLogRepository';
import { queryKeys } from './queryKeys';

export function usePlayLogs() {
  return useQuery({
    queryKey: queryKeys.playLogs,
    queryFn: () => playLogRepository.getAll(),
  });
}

export function usePlayLog(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.playLogs, id] as const,
    queryFn: () => playLogRepository.getById(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreatePlayLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePlayLogInput) => playLogRepository.add(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playLogs });
    },
  });
}

export function useUpdatePlayLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlayLogInput }) => playLogRepository.update(id, input),
    onSuccess: (_updated, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playLogs });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.playLogs, variables.id] });
    },
  });
}

export function useDeletePlayLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => playLogRepository.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playLogs });
    },
  });
}
