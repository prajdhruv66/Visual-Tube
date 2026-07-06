import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api/userApi';

export function useChannelProfile(username: string | undefined) {
  return useQuery({
    queryKey: ['channel', username],
    queryFn: () => userApi.getChannelProfile(username as string),
    enabled: !!username,
  });
}
