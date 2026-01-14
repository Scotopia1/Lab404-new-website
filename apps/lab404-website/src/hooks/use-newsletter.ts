import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SubscribeInput {
  email: string;
  name?: string;
  source?: 'footer' | 'checkout' | 'popup';
}

interface SubscribeResponse {
  success: boolean;
  data: {
    message: string;
    subscribed: boolean;
  };
}

export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: async (data: SubscribeInput) => {
      const response = await api.post<SubscribeResponse>('/contact/newsletter', data);
      return response.data.data;
    },
  });
}
