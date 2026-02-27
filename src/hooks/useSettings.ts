import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, authApi, type RestaurantSettings, type Restaurant } from '@/lib/api';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const settingsKeys = {
  all: ['settings'] as const,
  detail: () => [...settingsKeys.all, 'detail'] as const,
  restaurant: () => ['restaurant'] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useRestaurantSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async () => {
      const res = await settingsApi.get();
      if (!res.success) throw new Error(res.error || 'Failed to fetch settings');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min — settings rarely change
  });
}

/**
 * Fetches the current user's restaurant info from AdaAuth /auth/profile
 * Returns the first restaurant (L'Osteria in our case)
 */
export function useMyRestaurant() {
  return useQuery({
    queryKey: settingsKeys.restaurant(),
    queryFn: async () => {
      const res = await authApi.getMyRestaurants();
      if (!res.success) throw new Error(res.error || 'Failed to fetch restaurant');
      return res.data[0] || null;  // Return first restaurant
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 min — restaurant info rarely changes
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Partial<{
        opening_hours: Record<string, any>;
        schedule_rules: Record<string, any>;
        restaurant_info: Record<string, any>;
      }>
    ) => {
      const res = await settingsApi.update(data);
      if (!res.success) throw new Error(res.error || 'Failed to save settings');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail() });
    },
  });
}
