import { apiClient, unwrap } from './apiClient';
import type { ChannelProfile } from '@/types/models';

export const subscriptionApi = {
  getSubscribedChannels: () => unwrap<ChannelProfile[]>(apiClient.get('/subscription/subscription')),

  toggle: (channelId: string) =>
    unwrap<{ isSubscribed: boolean }>(apiClient.post(`/subscription/${channelId}`)),
};
