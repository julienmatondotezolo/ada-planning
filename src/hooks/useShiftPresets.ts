import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftPresetsApi, type ShiftPreset, type ShiftTimeRange } from '@/lib/api';

export const shiftPresetKeys = {
  all: ['shift-presets'] as const,
  list: () => [...shiftPresetKeys.all, 'list'] as const,
};

export function useShiftPresets() {
  return useQuery({
    queryKey: shiftPresetKeys.list(),
    queryFn: async () => {
      const res = await shiftPresetsApi.getAll();
      if (!res.success) throw new Error(res.error || 'Failed to fetch shift presets');
      return res.data;
    },
  });
}

export function useCreateShiftPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; color?: string; shifts: ShiftTimeRange[]; sort_order?: number }) => {
      const res = await shiftPresetsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create shift preset');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftPresetKeys.list() });
    },
  });
}

export function useUpdateShiftPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; color: string; shifts: ShiftTimeRange[]; sort_order: number }> }) => {
      const res = await shiftPresetsApi.update(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to update shift preset');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftPresetKeys.list() });
    },
  });
}

export function useDeleteShiftPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await shiftPresetsApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete shift preset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftPresetKeys.list() });
    },
  });
}
