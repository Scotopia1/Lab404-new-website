import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api-client';

// Types
export interface TemplateItem {
  productId?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
  defaultDiscount: number | null;
  defaultDiscountType: 'percentage' | 'fixed' | null;
  defaultTaxRate: number | null;
  defaultValidDays: number;
  defaultTerms: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  items: TemplateItem[];
  defaultDiscount?: number;
  defaultDiscountType?: 'percentage' | 'fixed';
  defaultTaxRate?: number;
  defaultValidDays?: number;
  defaultTerms?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string | null;
  items?: TemplateItem[];
  defaultDiscount?: number | null;
  defaultDiscountType?: 'percentage' | 'fixed' | null;
  defaultTaxRate?: number | null;
  defaultValidDays?: number;
  defaultTerms?: string | null;
  isActive?: boolean;
}

// API functions
async function fetchTemplates(activeOnly = true): Promise<QuotationTemplate[]> {
  const response = await api.get(`/quotation-templates?activeOnly=${activeOnly}`);
  return response.data.data;
}

async function fetchTemplate(id: string): Promise<QuotationTemplate> {
  const response = await api.get(`/quotation-templates/${id}`);
  return response.data.data;
}

async function createTemplate(data: CreateTemplateInput): Promise<QuotationTemplate> {
  const response = await api.post('/quotation-templates', data);
  return response.data.data;
}

async function updateTemplate(id: string, data: UpdateTemplateInput): Promise<QuotationTemplate> {
  const response = await api.put(`/quotation-templates/${id}`, data);
  return response.data.data;
}

async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/quotation-templates/${id}`);
}

// Hooks
export function useQuotationTemplates(activeOnly = true) {
  return useQuery({
    queryKey: ['quotation-templates', { activeOnly }],
    queryFn: () => fetchTemplates(activeOnly),
  });
}

export function useQuotationTemplate(id: string) {
  return useQuery({
    queryKey: ['quotation-template', id],
    queryFn: () => fetchTemplate(id),
    enabled: !!id,
  });
}

export function useCreateQuotationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
    },
  });
}

export function useUpdateQuotationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateInput }) =>
      updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
      queryClient.invalidateQueries({ queryKey: ['quotation-template', id] });
    },
  });
}

export function useDeleteQuotationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
    },
  });
}
