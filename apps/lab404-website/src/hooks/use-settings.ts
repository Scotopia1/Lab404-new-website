import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PublicSettings {
  // Business
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  currency: string;
  currency_symbol: string;
  // Tax
  tax_rate: number;
  tax_label: string;
  tax_enabled: boolean;
  // Delivery
  delivery_fee: number;
  delivery_enabled: boolean;
  free_delivery_threshold: number;
  // System
  site_title: string;
  site_description: string;
}

interface SettingsResponse {
  success: boolean;
  data: PublicSettings;
}

// Fetch public settings (non-authenticated)
export function useSettings(): UseQueryResult<PublicSettings> {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const response = await api.get<SettingsResponse>('/settings/public');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
