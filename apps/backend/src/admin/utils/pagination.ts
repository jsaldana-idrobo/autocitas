export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  pageRaw?: string,
  limitRaw?: string,
  maxLimit = 100
): PaginationParams | null {
  if (!pageRaw && !limitRaw) return null;
  const page = Math.max(1, Number(pageRaw || 1) || 1);
  const limitValue = Number(limitRaw || 25) || 25;
  const limit = Math.max(1, Math.min(maxLimit, limitValue));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
