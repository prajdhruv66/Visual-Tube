import { Link } from 'react-router-dom';
import type { Video } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { VideoGridSkeleton } from '@/components/ui/Skeleton';
import { formatDuration, formatRelativeTime, formatViews } from '@/utils/format';
import { useFeed } from '@/features/home/hooks/useFeed';

/**
 * ASSUMPTION: there's no dedicated "related videos" endpoint in the Postman
 * collection, so recommendations reuse the trending feed, excluding the
 * currently playing video.
 */
export function RecommendedList({ excludeVideoId }: { excludeVideoId: string }) {
  const { data, isLoading } = useFeed('trending');
  const videos = (data?.pages.flatMap((p) => p.items) ?? []).filter((v) => v._id !== excludeVideoId);

  if (isLoading) return <VideoGridSkeleton count={4} />;

  return (
    <div className="flex flex-col gap-3">
      {videos.slice(0, 12).map((video) => (
        <RecommendedItem key={video._id} video={video} />
      ))}
    </div>
  );
}

function RecommendedItem({ video }: { video: Video }) {
  const owner = typeof video.owner === 'string' ? null : video.owner;
  return (
    <Link to={`/watch/${video._id}`} className="group flex gap-2.5">
      <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-md bg-surface-2">
        <img src={video.thumbnail} alt={video.title} loading="lazy" className="h-full w-full object-cover" />
        <Badge className="absolute bottom-1.5 right-1.5 z-10">{formatDuration(video.duration)}</Badge>
      </div>
      <div className="min-w-0">
        <h4 className="line-clamp-2 text-sm font-medium leading-snug text-text-primary group-hover:text-accent-text">
          {video.title}
        </h4>
        {owner && <p className="mt-1 truncate text-xs text-text-secondary">{owner.fullname}</p>}
        <p className="font-mono text-[11px] text-text-tertiary">
          {formatViews(video.views)} · {formatRelativeTime(video.createdAt)}
        </p>
      </div>
    </Link>
  );
}
