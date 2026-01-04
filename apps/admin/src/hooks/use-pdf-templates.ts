"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export interface PdfTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  showCompanyLogo: boolean;
  showLineItemImages: boolean;
  showLineItemDescription: boolean;
  showSku: boolean;
  headerText: string | null;
  footerText: string | null;
  thankYouMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PdfTemplateInput {
  name: string;
  isDefault?: boolean;
  logoUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  showCompanyLogo?: boolean;
  showLineItemImages?: boolean;
  showLineItemDescription?: boolean;
  showSku?: boolean;
  headerText?: string | null;
  footerText?: string | null;
  thankYouMessage?: string | null;
}

// Fetch all PDF templates
export function usePdfTemplates() {
  return useQuery({
    queryKey: ["pdf-templates"],
    queryFn: async () => {
      const response = await api.get<{ data: PdfTemplate[] }>("/pdf-templates");
      return response.data;
    },
  });
}

// Fetch single PDF template
export function usePdfTemplate(id: string) {
  return useQuery({
    queryKey: ["pdf-templates", id],
    queryFn: async () => {
      const response = await api.get<{ data: PdfTemplate }>(`/pdf-templates/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch default PDF template
export function useDefaultPdfTemplate() {
  return useQuery({
    queryKey: ["pdf-templates", "default"],
    queryFn: async () => {
      const response = await api.get<{ data: PdfTemplate }>("/pdf-templates/default");
      return response.data;
    },
  });
}

// Create PDF template
export function useCreatePdfTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PdfTemplateInput) => {
      const response = await api.post<{ data: PdfTemplate }>("/pdf-templates", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
      toast.success("PDF template created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create PDF template");
    },
  });
}

// Update PDF template
export function useUpdatePdfTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PdfTemplateInput> }) => {
      const response = await api.put<{ data: PdfTemplate }>(`/pdf-templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
      toast.success("PDF template updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update PDF template");
    },
  });
}

// Delete PDF template
export function useDeletePdfTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pdf-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
      toast.success("PDF template deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete PDF template");
    },
  });
}

// Set template as default
export function useSetDefaultPdfTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ data: PdfTemplate }>(`/pdf-templates/${id}/set-default`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
      toast.success("Default template updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to set default template");
    },
  });
}
