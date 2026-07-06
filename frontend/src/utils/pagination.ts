import type { Paginated, RawPaginated } from '@/types/api';

/**
 * Normalizes the backend's paginated payload into a single predictable shape
 * used everywhere in the app. If the backend's actual field names differ from
 * the ones guessed below, this is the only place that needs to change.
 */
export function normalizePaginated<T>(raw: RawPaginated<T> | T[]): Paginated<T> {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      page: 1,
      limit: raw.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const items = raw.docs ?? raw.videos ?? (raw as any).comments ?? raw.results ?? raw.items ?? [];
  const page = raw.page ?? raw.currentPage ?? 1;
  const limit = raw.limit ?? 10;
  
  // Calculate total pages and next page flags based on backend facet metadata if present
  const metadata = (raw as any).metadata?.[0];
  const totalItems = metadata?.totalVideos ?? metadata?.totalComments ?? metadata?.totalLikes ?? items.length;
  const totalPages = raw.totalPages ?? (Math.ceil(totalItems / limit) || 1);

  return {
    items,
    page,
    limit,
    totalPages,
    hasNextPage: raw.hasNextPage ?? page < totalPages,
    hasPrevPage: raw.hasPrevPage ?? page > 1,
  };
}
