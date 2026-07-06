import { History } from 'lucide-react';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { VideoGrid } from '@/components/media/VideoGrid';
import { VideoGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { getErrorMessage } from '@/services/api/apiClient';

export default function HistoryPage() {
  const { data, isLoading, isError, error, refetch } = useWatchHistory();

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-semibold text-text-primary">Watch History</h1>

      {isLoading && <VideoGridSkeleton />}
      {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && (!data || data.items.length === 0) && (
        <EmptyState icon={History} title="No watch history" description="Videos you watch will show up here." />
      )}

      {!isLoading && data && data.items.length > 0 && <VideoGrid videos={data.items} />}
    </div>
  );
}
