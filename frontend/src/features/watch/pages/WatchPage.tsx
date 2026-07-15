import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useVideo } from '../hooks/useVideo';
import { useVideoLike } from '../hooks/useVideoLike';
import { useSubscribeToggle } from '../hooks/useSubscribeToggle';
import { useChannelProfile } from '@/features/channel/hooks/useChannelProfile';
import { CommentSection } from '../components/CommentSection';
import { RecommendedList } from '../components/RecommendedList';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProcessingVideo } from '../components/ProcessingVideo';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/utils/cn';
import { formatCompactNumber, formatRelativeTime, formatViews } from '@/utils/format';
import { getErrorMessage } from '@/services/api/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: video, isLoading, isError, error, refetch, invalidate } = useVideo(videoId);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeUrl, setActiveUrl] = useState('');
  const [selectedResolution, setSelectedResolution] = useState('');

  useEffect(() => {
    if (video) {
      const resolutions = video.availableResolutions || [];
      if (resolutions.length > 0) {
        const defaultRes = resolutions[resolutions.length - 1];
        setActiveUrl(defaultRes.url);
        setSelectedResolution(defaultRes.resolution);
      } else {
        setActiveUrl(video.videoFile);
        setSelectedResolution('Original');
      }
    }
  }, [video]);
  
  const handleWatchRegistered = () => {
    console.log("handleWatchRegistered called - invalidating and refetching history");
    invalidate();
    // Explicitly refetch the history query when watch is registered
    queryClient.refetchQueries({ queryKey: ['history'] }).then(() => {
      console.log("History refetch completed");
    });
  };

  const owner = video && typeof video.owner !== 'string' ? video.owner : null;
  const channelQuery = useChannelProfile(owner?.username);
  const likeMutation = useVideoLike(videoId ?? '');
  const subscribeMutation = useSubscribeToggle(owner?.username ?? '');

  if (isLoading) return <FullPageSpinner />;
  if (isError || !video) return <ErrorState message={getErrorMessage(error, 'Video not found.')} onRetry={() => refetch()} />;

  if (video.processingStatus !== 'published') {
    return <ProcessingVideo status={video.processingStatus} />;
  }

  const isOwnVideo = user?._id === (owner?._id ?? video.owner);
  const channel = channelQuery.data;

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <VideoPlayer
          videoId={video._id}
          src={activeUrl || video.videoFile}
          poster={video.thumbnail}
          title={video.title}
          onWatchRegistered={handleWatchRegistered}
        />

        <h1 className="mt-4 font-display text-xl font-semibold text-text-primary">{video.title}</h1>
        <p className="mt-1 font-mono text-xs text-text-tertiary">
          {formatViews(video.views)} · {formatRelativeTime(video.createdAt)}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          {owner && (
            <Link to={`/channel/${owner.username}`} className="flex items-center gap-3">
              <Avatar src={owner.avatar} alt={owner.username} size="md" />
              <div>
                <p className="text-sm font-medium text-text-primary">{owner.fullname}</p>
                <p className="text-xs text-text-secondary">
                  {channel ? `${formatCompactNumber(channel.subscribersCount)} subscribers` : '\u00A0'}
                </p>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-2">
            {video.availableResolutions && video.availableResolutions.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-semibold text-text-secondary">Quality:</span>
                <select
                  value={selectedResolution}
                  onChange={(e) => {
                    const res = e.target.value;
                    setSelectedResolution(res);
                    if (res === 'Original') {
                      setActiveUrl(video.videoFile);
                    } else {
                      const found = video.availableResolutions?.find(r => r.resolution === res);
                      if (found) setActiveUrl(found.url);
                    }
                  }}
                  className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs font-semibold text-text-primary shadow-sm outline-none focus:border-accent hover:bg-surface-3 transition-colors cursor-pointer"
                >
                  {video.availableResolutions.map((res) => (
                    <option key={res.resolution} value={res.resolution}>
                      {res.resolution}
                    </option>
                  ))}
                  <option value="Original">Original</option>
                </select>
              </div>
            )}
            {!isOwnVideo && owner && (
              <Button
                variant={channel?.isSubscribed ? 'secondary' : 'primary'}
                onClick={() => subscribeMutation.mutate(owner._id)}
                isLoading={subscribeMutation.isPending}
              >
                {channel?.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => likeMutation.mutate()}
              isLoading={likeMutation.isPending}
              className={cn(video.isLiked && 'border-accent text-accent-text')}
            >
              <ThumbsUp className={cn('h-4 w-4', video.isLiked && 'fill-current')} />
              {formatCompactNumber(video.likesCount ?? 0)}
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-surface p-4">
          <p className={cn('whitespace-pre-wrap text-sm text-text-primary', !showFullDescription && 'line-clamp-3')}>
            {video.description}
          </p>
          {video.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-3 px-2.5 py-1 text-xs text-text-secondary">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowFullDescription((v) => !v)}
            className="mt-2 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            {showFullDescription ? 'Show less' : 'Show more'}
          </button>
        </div>

        <CommentSection videoId={video._id} />
      </div>

      <aside>
        <RecommendedList excludeVideoId={video._id} />
      </aside>
    </div>
  );
}
