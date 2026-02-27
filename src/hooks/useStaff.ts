import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, shiftsApi, type Employee, type Shift } from '@/lib/api';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const staffKeys = {
  all: ['staff'] as const,
  list: (filters?: Record<string, any>) => [...staffKeys.all, 'list', filters] as const,
};

export const shiftKeys = {
  all: ['shifts'] as const,
  list: (filters?: Record<string, any>) => [...shiftKeys.all, 'list', filters] as const,
};

// ─── Staff Hooks ────────────────────────────────────────────────────────────

export function useEmployees(params?: { active_only?: boolean }) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: async () => {
      const res = await staffApi.getAll(params);
      if (!res.success) throw new Error(res.error || 'Failed to fetch employees');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min — staff list rarely changes
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await staffApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

// ─── Shift Hooks ────────────────────────────────────────────────────────────

export function useShifts(params?: { start_date?: string; end_date?: string; employee_id?: string }) {
  return useQuery({
    queryKey: shiftKeys.list(params),
    queryFn: async () => {
      const res = await shiftsApi.getAll(params);
      if (!res.success) throw new Error(res.error || 'Failed to fetch shifts');
      return res.data;
    },
    enabled: !!params?.start_date, // don't fetch until we have a date range
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Shift>) => {
      const res = await shiftsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create shift');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Shift> }) => {
      const res = await shiftsApi.update(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to update shift');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await shiftsApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete shift');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
    },
  });
}
