import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ListVideo } from 'lucide-react';
import { useChannelProfile } from '../hooks/useChannelProfile';
import { useChannelVideos } from '../hooks/useChannelVideos';
import { useSubscribeToggle } from '@/features/watch/hooks/useSubscribeToggle';
import { useUserPlaylists } from '@/features/playlists/hooks/usePlaylists';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { InfiniteVideoFeed } from '@/components/media/InfiniteVideoFeed';
import { formatCompactNumber } from '@/utils/format';
import { getErrorMessage } from '@/services/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

export default function ChannelPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { data: channel, isLoading, isError, error, refetch } = useChannelProfile(username);
  const subscribeMutation = useSubscribeToggle(username ?? '');
  const videosQuery = useChannelVideos(channel?._id);
  const { data: playlists, isLoading: isLoadingPlaylists, isError: isPlaylistsError, error: playlistsError } = useUserPlaylists(
    user ? channel?._id : undefined
  );

  const [activeTab, setActiveTab] = useState<'videos' | 'playlists'>('videos');

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

      {/* Tabs Navbar */}
      <div className="mt-8 mb-6 flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('videos')}
          className={cn(
            'relative px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'videos' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Videos
          {activeTab === 'videos' && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          className={cn(
            'relative px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'playlists' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Playlists
          {activeTab === 'playlists' && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {activeTab === 'videos' ? (
        <InfiniteVideoFeed
          query={videosQuery}
          emptyTitle="No videos uploaded"
          emptyDescription={`${channel.fullname} hasn't uploaded any videos yet.`}
          manageable={isOwnChannel}
        />
      ) : (
        <div>
          {!user ? (
            <EmptyState
              icon={ListVideo}
              title="Sign in to view playlists"
              description="You must be signed in to browse this channel's playlists."
            />
          ) : isLoadingPlaylists ? (
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-lg" />
              ))}
            </div>
          ) : isPlaylistsError ? (
            <ErrorState message={getErrorMessage(playlistsError, 'Could not load playlists.')} />
          ) : !playlists || playlists.length === 0 ? (
            <EmptyState
              icon={ListVideo}
              title="No playlists"
              description={`${channel.fullname} hasn't created any playlists yet.`}
            />
          ) : (
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {playlists.map((playlist) => {
                const hasVideos = playlist.videos && playlist.videos.length > 0;
                const firstVideo = hasVideos ? playlist.videos[0] : null;
                return (
                  <Link key={playlist._id} to={`/playlists/${playlist._id}`} className="group block">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-2">
                      {firstVideo ? (
                        <img
                          src={firstVideo.thumbnail}
                          alt={playlist.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-3 text-text-tertiary">
                          <ListVideo className="h-10 w-10" />
                        </div>
                      )}
                      {/* Playlist overlay */}
                      <div className="absolute inset-y-0 right-0 flex w-1/3 flex-col items-center justify-center bg-black/60 text-white backdrop-blur-xs">
                        <ListVideo className="mb-1 h-5 w-5" />
                        <span className="font-mono text-xs font-semibold">{playlist.videos.length}</span>
                      </div>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-text-primary group-hover:text-accent-text line-clamp-1">
                      {playlist.name}
                    </h3>
                    {playlist.description && (
                      <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                        {playlist.description}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-[10px] text-text-tertiary">
                      Updated {new Date(playlist.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
