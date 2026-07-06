import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/feedback/EmptyState';
import { VideoOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChannelVideos } from '@/features/channel/hooks/useChannelVideos';
import { formatDuration } from '@/utils/format';
import type { Video } from '@/types/models';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingVideoIds: string[];
  onAdd: (videoId: string) => void;
  isAdding: boolean;
}

export function AddVideoModal({ isOpen, onClose, existingVideoIds, onAdd, isAdding }: AddVideoModalProps) {
  const { user } = useAuth();
  const { data, isLoading } = useChannelVideos(user?._id);
  const videos: Video[] = data?.pages.flatMap((p) => p.items) ?? [];
  const availableVideos = videos.filter((v) => !existingVideoIds.includes(v._id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add video to playlist">
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!isLoading && availableVideos.length === 0 && (
        <EmptyState icon={VideoOff} title="No videos to add" description="All your videos are already in this playlist." />
      )}

      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {availableVideos.map((video) => (
          <div key={video._id} className="flex items-center gap-3 rounded-md p-2 hover:bg-surface-2">
            <Avatar src={video.thumbnail} alt={video.title} size="lg" className="rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm text-text-primary">{video.title}</p>
              <p className="font-mono text-xs text-text-tertiary">{formatDuration(video.duration)}</p>
            </div>
            <Button size="sm" variant="outline" isLoading={isAdding} onClick={() => onAdd(video._id)}>
              Add
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
