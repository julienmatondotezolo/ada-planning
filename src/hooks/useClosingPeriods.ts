import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { closingPeriodsApi, type ClosingPeriod } from '@/lib/api';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const closingPeriodKeys = {
  all: ['closing-periods'] as const,
  list: () => [...closingPeriodKeys.all, 'list'] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useClosingPeriods() {
  return useQuery({
    queryKey: closingPeriodKeys.list(),
    queryFn: async () => {
      const res = await closingPeriodsApi.getAll();
      if (!res.success) throw new Error(res.error || 'Failed to fetch closing periods');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateClosingPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; date_from: string; date_to: string; comment?: string }) => {
      const res = await closingPeriodsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create closing period');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: closingPeriodKeys.all });
    },
  });
}

export function useUpdateClosingPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; date_from: string; date_to: string; comment?: string }> }) => {
      const res = await closingPeriodsApi.update(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to update closing period');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: closingPeriodKeys.all });
    },
  });
}

export function useDeleteClosingPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await closingPeriodsApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete closing period');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: closingPeriodKeys.all });
    },
  });
}
