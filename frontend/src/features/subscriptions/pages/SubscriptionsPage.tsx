import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useSubscribedChannels } from '../hooks/useSubscribedChannels';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatCompactNumber } from '@/utils/format';
import { getErrorMessage } from '@/services/api/apiClient';

export default function SubscriptionsPage() {
  const { data: channels, isLoading, isError, error, refetch } = useSubscribedChannels();

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-semibold text-text-primary">Subscriptions</h1>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && (!channels || channels.length === 0) && (
        <EmptyState
          icon={Users}
          title="No subscriptions yet"
          description="Channels you subscribe to will appear here."
        />
      )}

      {!isLoading && channels && channels.length > 0 && (
        <div className="flex flex-col divide-y divide-border">
          {channels.map((channel) => (
            <Link
              key={channel._id}
              to={`/channel/${channel.username}`}
              className="flex items-center gap-4 py-4 hover:bg-surface-2"
            >
              <Avatar src={channel.avatar} alt={channel.username} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{channel.fullname}</p>
                <p className="truncate text-xs text-text-secondary">
                  @{channel.username} · {formatCompactNumber(channel.subscribersCount)} subscribers
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
