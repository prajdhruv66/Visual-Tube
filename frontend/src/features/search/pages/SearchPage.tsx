import { useSearchParams } from 'react-router-dom';
import { useSearchFeed } from '../hooks/useSearchFeed';
import { InfiniteVideoFeed } from '@/components/media/InfiniteVideoFeed';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const query = useSearchFeed(q);

  return (
    <div>
      <h1 className="mb-6 text-sm text-text-secondary">
        Search results for <span className="font-medium text-text-primary">&ldquo;{q}&rdquo;</span>
      </h1>
      <InfiniteVideoFeed
        query={query}
        emptyTitle="No results found"
        emptyDescription="Try different keywords or check your spelling."
      />
    </div>
  );
}
