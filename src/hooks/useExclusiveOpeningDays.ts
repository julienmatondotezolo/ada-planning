import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exclusiveOpeningDaysApi, type ExclusiveOpeningDay } from '@/lib/api';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const exclusiveOpeningDayKeys = {
  all: ['exclusive-opening-days'] as const,
  list: () => [...exclusiveOpeningDayKeys.all, 'list'] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useExclusiveOpeningDays() {
  return useQuery({
    queryKey: exclusiveOpeningDayKeys.list(),
    queryFn: async () => {
      const res = await exclusiveOpeningDaysApi.getAll();
      if (!res.success) throw new Error(res.error || 'Failed to fetch exclusive opening days');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExclusiveOpeningDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; date_from: string; date_to: string; comment?: string }) => {
      const res = await exclusiveOpeningDaysApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create exclusive opening day');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exclusiveOpeningDayKeys.all });
    },
  });
}

export function useUpdateExclusiveOpeningDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; date_from: string; date_to: string; comment?: string }> }) => {
      const res = await exclusiveOpeningDaysApi.update(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to update exclusive opening day');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exclusiveOpeningDayKeys.all });
    },
  });
}

export function useDeleteExclusiveOpeningDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await exclusiveOpeningDaysApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete exclusive opening day');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exclusiveOpeningDayKeys.all });
    },
  });
}
