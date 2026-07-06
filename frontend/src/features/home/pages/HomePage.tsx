import { useState } from 'react';
import { cn } from '@/utils/cn';
import { useFeed, usePersonalisedFeed } from '../hooks/useFeed';
import { InfiniteVideoFeed } from '@/components/media/InfiniteVideoFeed';

type Tab = 'personalized' | 'trending' | 'newest';

const tabs: { key: Tab; label: string }[] = [
  { key: 'personalized', label: 'Personalized' },
  { key: 'trending', label: 'Trending' },
  { key: 'newest', label: 'Newest' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('personalized');

  const personalisedQuery = usePersonalisedFeed();
  const trendingQuery = useFeed('trending');
  const newestQuery = useFeed('newest');

  const activeQuery =
    activeTab === 'personalized' ? personalisedQuery : activeTab === 'trending' ? trendingQuery : newestQuery;

  return (
    <div>
      <div className="mb-6 flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'relative px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.key ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <InfiniteVideoFeed
        query={activeQuery}
        emptyTitle={activeTab === 'personalized' ? 'Nothing personalized yet' : 'No videos here yet'}
        emptyDescription={
          activeTab === 'personalized'
            ? 'Watch and subscribe to a few channels to get tailored recommendations.'
            : 'Check back soon for new uploads.'
        }
      />
    </div>
  );
}
