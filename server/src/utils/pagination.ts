/**
 * Utility to calculate pagination metadata and DB offset
 */
export const getPagination = (page: number = 1, limit: number = 10, total: number = 0) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit)); // Max limit 100
  const totalPages = Math.ceil(total / safeLimit);
  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    offset,
  };
};

export type PaginationResult = ReturnType<typeof getPagination>;
