import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api/userApi';
import { normalizePaginated } from '@/utils/pagination';

export function useWatchHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const raw = await userApi.getWatchHistory();
      return normalizePaginated(raw);
    },
  });
}
