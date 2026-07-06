import type { Video } from '@/types/models';
import { VideoCard } from './VideoCard';

export function VideoGrid({ videos, manageable = false }: { videos: Video[]; manageable?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} manageable={manageable} />
      ))}
    </div>
  );
}
