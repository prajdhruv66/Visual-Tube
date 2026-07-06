import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, ListVideo } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAddVideoToPlaylist,
  useDeletePlaylist,
  usePlaylist,
  useRemoveVideoFromPlaylist,
  useUpdatePlaylist,
} from '../hooks/usePlaylists';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';
import { AddVideoModal } from '../components/AddVideoModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { VideoCard } from '@/components/media/VideoCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDuration, formatRelativeTime, formatViews } from '@/utils/format';
import { getErrorMessage } from '@/services/api/apiClient';

export default function PlaylistDetailsPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { data: playlist, isLoading, isError, error, refetch } = usePlaylist(playlistId);
  const updatePlaylist = useUpdatePlaylist(playlistId ?? '');
  const deletePlaylist = useDeletePlaylist();
  const addVideo = useAddVideoToPlaylist(playlistId ?? '');
  const removeVideo = useRemoveVideoFromPlaylist(playlistId ?? '');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !playlist)
    return <ErrorState message={getErrorMessage(error, 'Playlist not found.')} onRetry={() => refetch()} />;

  const onDelete = async () => {
    if (!playlistId) return;
    try {
      await deletePlaylist.mutateAsync(playlistId);
      toast.success('Playlist deleted.');
      navigate('/playlists');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete playlist.'));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">{playlist.name}</h1>
          {playlist.description && <p className="mt-1 max-w-xl text-sm text-text-secondary">{playlist.description}</p>}
          <p className="mt-2 font-mono text-xs text-text-tertiary">{playlist.videos.length} videos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add video
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {playlist.videos.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title="This playlist is empty"
          description="Add videos to start building your playlist."
          actionLabel="Add video"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-4 divide-y divide-border">
          {playlist.videos.map((video) => {
            const owner = typeof video.owner === 'string' ? null : video.owner;
            return (
              <div key={video._id} className="group relative flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row">
                <Link
                  to={`/watch/${video._id}`}
                  className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-64 md:w-80"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <Badge className="absolute bottom-2 right-2 z-10">{formatDuration(video.duration)}</Badge>
                </Link>

                <div className="flex flex-1 flex-col pr-12 min-w-0">
                  <Link to={`/watch/${video._id}`}>
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug text-text-primary group-hover:text-accent-text">
                      {video.title}
                    </h3>
                  </Link>

                  {video.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                      {video.description}
                    </p>
                  )}

                  <p className="mt-1 font-mono text-[11px] text-text-tertiary">
                    {formatViews(video.views)} · {formatRelativeTime(video.createdAt)}
                  </p>

                  {owner && (
                    <Link to={`/channel/${owner.username}`} className="mt-3 flex items-center gap-2 hover:opacity-80">
                      <Avatar src={owner.avatar} alt={owner.fullname} size="xs" />
                      <span className="truncate text-xs font-medium text-text-secondary">
                        {owner.fullname} <span className="text-text-tertiary">@{owner.username}</span>
                      </span>
                    </Link>
                  )}
                </div>

                <button
                  onClick={() => removeVideo.mutate(video._id)}
                  aria-label="Remove from playlist"
                  className="absolute right-2 top-4 rounded-full p-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 sm:top-1/2 sm:-translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <CreatePlaylistModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit playlist"
        submitLabel="Save changes"
        defaultValues={{ name: playlist.name, description: playlist.description }}
        onSubmit={async (values) => {
          await updatePlaylist.mutateAsync(values);
          toast.success('Playlist updated.');
        }}
      />

      <AddVideoModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        existingVideoIds={playlist.videos.map((v) => v._id)}
        isAdding={addVideo.isPending}
        onAdd={(videoId) => {
          addVideo.mutate(videoId, {
            onSuccess: () => toast.success('Video added to playlist.'),
            onError: (err) => toast.error(getErrorMessage(err, 'Could not add video.')),
          });
        }}
      />

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete this playlist?">
        <p className="text-sm text-text-secondary">
          &ldquo;{playlist.name}&rdquo; will be permanently deleted. This action can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deletePlaylist.isPending} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
