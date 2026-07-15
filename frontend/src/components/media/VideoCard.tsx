import { Link } from 'react-router-dom';
import { memo } from 'react';
import { Pencil, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { Video } from '@/types/models';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDuration, formatRelativeTime, formatViews } from '@/utils/format';

function VideoCardImpl({ video, manageable = false }: { video: Video; manageable?: boolean }) {
  const owner = typeof video.owner === 'string' ? null : video.owner;
  const status = video.processingStatus;
  const isProcessing = status === 'processing';
  const isQueued = status === 'queued';
  const isFailed = status === 'failed';
  const notPublishedYet = status && status !== 'published';

  return (
    <div className="group flex flex-col gap-3 animate-fade-in">
      <Link to={`/watch/${video._id}`} className="viewfinder relative block aspect-video w-full overflow-hidden rounded-lg bg-surface-2 shadow-md">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        
        {/* Processing State Overlay */}
        {notPublishedYet && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xs text-white p-3">
            {isQueued && (
              <>
                <Clock className="h-6 w-6 text-amber-500 animate-pulse" />
                <span className="mt-1 text-xs font-bold text-amber-400">In Queue</span>
              </>
            )}
            {isProcessing && (
              <>
                <Loader2 className="h-6 w-6 text-accent animate-spin" />
                <span className="mt-1 text-xs font-bold text-accent-text">Processing...</span>
                <div className="w-16 h-1 bg-surface-3 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-accent animate-pulse w-3/5" />
                </div>
              </>
            )}
            {isFailed && (
              <>
                <AlertCircle className="h-6 w-6 text-danger animate-pulse" />
                <span className="mt-1 text-xs font-bold text-danger">Failed</span>
              </>
            )}
          </div>
        )}

        {!notPublishedYet && <Badge className="absolute bottom-2 right-2 z-10">{formatDuration(video.duration)}</Badge>}
        {!video.isPublished && <Badge className="absolute left-2 top-2 bg-surface-3/90">Private</Badge>}
      </Link>
      <div className="flex gap-3">
        {owner && <Avatar src={owner.avatar} alt={owner.username} size="sm" />}
        <div className="min-w-0 flex-1">
          <Link to={`/watch/${video._id}`}>
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-text-primary group-hover:text-accent-text">
              {video.title}
            </h3>
          </Link>
          {owner && <p className="mt-1 truncate text-xs text-text-secondary">{owner.fullname}</p>}
          
          {notPublishedYet ? (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold">
              {isQueued && <span className="text-amber-400">Queued</span>}
              {isProcessing && <span className="text-accent-text animate-pulse">Processing Resolutions...</span>}
              {isFailed && <span className="text-danger">Transcoding Failed</span>}
            </p>
          ) : (
            <p className="font-mono text-[11px] text-text-tertiary">
              {formatViews(video.views)} · {formatRelativeTime(video.createdAt)}
            </p>
          )}
        </div>
        {manageable && (
          <Link
            to={`/manage/${video._id}`}
            aria-label="Edit video"
            className="h-8 w-8 shrink-0 rounded-md p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export const VideoCard = memo(VideoCardImpl);
