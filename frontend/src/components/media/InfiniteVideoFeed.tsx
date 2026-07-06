import { useEffect, useRef } from 'react';
import type { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import type { Video } from '@/types/models';
import type { Paginated } from '@/types/api';
import { VideoGrid } from './VideoGrid';
import { VideoGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { VideoOff } from 'lucide-react';
import { getErrorMessage } from '@/services/api/apiClient';

interface InfiniteVideoFeedProps {
  query: UseInfiniteQueryResult<InfiniteData<Paginated<Video>>, unknown>;
  emptyTitle?: string;
  emptyDescription?: string;
  manageable?: boolean;
}

export function InfiniteVideoFeed({
  query,
  emptyTitle = 'No videos yet',
  emptyDescription = 'Check back later for new uploads.',
  manageable = false,
}: InfiniteVideoFeedProps) {
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <VideoGridSkeleton />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const videos = data?.pages.flatMap((p) => p.items) ?? [];
  if (videos.length === 0) {
    return <EmptyState icon={VideoOff} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <VideoGrid videos={videos} manageable={manageable} />
      <div ref={sentinelRef} className="flex justify-center py-8">
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  );
}
