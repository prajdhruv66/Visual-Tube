/**
 * Standard success envelope returned by the Visual-Tube backend.
 * Confirmed shape: { statusCode, data, message, success }
 */
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

/**
 * Standard error envelope. Axios will surface this via error.response.data.
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  success: false;
  errors?: string[];
}

/**
 * Generic paginated shape.
 *
 * ASSUMPTION: the Postman collection does not include saved example responses,
 * so the exact key names for paginated lists (mongoose-paginate-v2 /
 * aggregate-paginate style) are inferred. If your backend uses different key
 * names, adjust `normalizePaginated` in `src/utils/pagination.ts` — every
 * feature hook reads pagination through that single function.
 */
export interface RawPaginated<T> {
  docs?: T[];
  videos?: T[];
  results?: T[];
  items?: T[];
  totalDocs?: number;
  totalVideos?: number;
  totalResults?: number;
  limit?: number;
  page?: number;
  currentPage?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
