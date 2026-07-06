import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type { ChannelProfile } from '@/types/models';

export function useSubscribeToggle(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => subscriptionApi.toggle(channelId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['channel', username] });
      const previous = queryClient.getQueryData<ChannelProfile>(['channel', username]);
      if (previous) {
        queryClient.setQueryData<ChannelProfile>(['channel', username], {
          ...previous,
          isSubscribed: !previous.isSubscribed,
          subscribersCount: previous.subscribersCount + (previous.isSubscribed ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['channel', username], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', username] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
