import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListVideo } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useCreatePlaylist, useUserPlaylists } from '../hooks/usePlaylists';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getErrorMessage } from '@/services/api/apiClient';

export default function MyPlaylistsPage() {
  const { user } = useAuth();
  const { data: playlists, isLoading, isError, error, refetch } = useUserPlaylists(user?._id);
  const createPlaylist = useCreatePlaylist(user?._id);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-text-primary">My Playlists</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Create playlist
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && (!playlists || playlists.length === 0) && (
        <EmptyState
          icon={ListVideo}
          title="No playlists yet"
          description="Create your first playlist to organize videos."
          actionLabel="Create playlist"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {!isLoading && playlists && playlists.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist._id}
              to={`/playlists/${playlist._id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong"
            >
              <div className="viewfinder relative aspect-video w-full bg-surface-2">
                {playlist.videos[0] ? (
                  <img src={playlist.videos[0].thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-tertiary">
                    <ListVideo className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-3">
                  <span className="font-mono text-xs text-white">{playlist.videos.length} videos</span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-medium text-text-primary group-hover:text-accent-text">
                  {playlist.name}
                </h3>
                {playlist.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{playlist.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => {
          await createPlaylist.mutateAsync(values);
          toast.success('Playlist created.');
        }}
      />
    </div>
  );
}
