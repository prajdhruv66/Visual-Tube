import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/services/api/subscriptionApi';

export function useSubscribedChannels(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.getSubscribedChannels(),
    ...options,
  });
}
