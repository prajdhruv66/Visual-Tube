import { Link } from 'react-router-dom';
import { memo } from 'react';
import { Pencil } from 'lucide-react';
import type { Video } from '@/types/models';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDuration, formatRelativeTime, formatViews } from '@/utils/format';

function VideoCardImpl({ video, manageable = false }: { video: Video; manageable?: boolean }) {
  const owner = typeof video.owner === 'string' ? null : video.owner;

  return (
    <div className="group flex flex-col gap-3">
      <Link to={`/watch/${video._id}`} className="viewfinder relative block aspect-video w-full overflow-hidden rounded-lg bg-surface-2">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <Badge className="absolute bottom-2 right-2 z-10">{formatDuration(video.duration)}</Badge>
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
          <p className="font-mono text-[11px] text-text-tertiary">
            {formatViews(video.views)} · {formatRelativeTime(video.createdAt)}
          </p>
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
