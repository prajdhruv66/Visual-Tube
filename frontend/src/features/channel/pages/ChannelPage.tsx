import { useParams } from 'react-router-dom';
import { useChannelProfile } from '../hooks/useChannelProfile';
import { useChannelVideos } from '../hooks/useChannelVideos';
import { useSubscribeToggle } from '@/features/watch/hooks/useSubscribeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InfiniteVideoFeed } from '@/components/media/InfiniteVideoFeed';
import { formatCompactNumber } from '@/utils/format';
import { getErrorMessage } from '@/services/api/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function ChannelPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { data: channel, isLoading, isError, error, refetch } = useChannelProfile(username);
  const subscribeMutation = useSubscribeToggle(username ?? '');
  const videosQuery = useChannelVideos(channel?._id);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !channel)
    return <ErrorState message={getErrorMessage(error, 'Channel not found.')} onRetry={() => refetch()} />;

  const isOwnChannel = user?._id === channel._id;

  return (
    <div>
      <div className="h-40 w-full overflow-hidden rounded-lg bg-surface-2 sm:h-56">
        {channel.coverImage && (
          <img src={channel.coverImage} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="-mt-10 flex flex-col items-start gap-4 px-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <Avatar src={channel.avatar} alt={channel.username} size="xl" className="ring-4 ring-bg" />
          <div className="pb-1">
            <h1 className="font-display text-xl font-semibold text-text-primary">{channel.fullname}</h1>
            <p className="text-sm text-text-secondary">
              @{channel.username} · {formatCompactNumber(channel.subscribersCount)} subscribers
            </p>
          </div>
        </div>

        {!isOwnChannel && (
          <Button
            variant={channel.isSubscribed ? 'secondary' : 'primary'}
            onClick={() => subscribeMutation.mutate(channel._id)}
            isLoading={subscribeMutation.isPending}
            className="sm:mb-1"
          >
            {channel.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        )}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Uploaded videos</h2>
        <InfiniteVideoFeed
          query={videosQuery}
          emptyTitle="No videos uploaded"
          emptyDescription={`${channel.fullname} hasn't uploaded any videos yet.`}
          manageable={isOwnChannel}
        />
      </div>
    </div>
  );
}
