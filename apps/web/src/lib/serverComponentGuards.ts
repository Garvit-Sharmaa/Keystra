
/** Forces dynamic rendering — opt out of the Next.js Full Route Cache. */
export const dynamic = 'force-dynamic' as const;

/**
 * Generates a namespaced cache tag for user-scoped data revalidation.
 *
 * @example
 *   // In a Server Component fetch:
 *   fetch(`/api/users/${userId}/stats`, {
 *     next: { tags: [userCacheTag(userId)] },
 *   });
 *
 *   // In an API route after data mutation:
 *   revalidateTag(userCacheTag(userId));
 */
export const userCacheTag = (userId: string): string => `user-${userId}`;

/**
 * Cache tag for the full curriculum/academy page.
 * Invalidate when chapter_progress is written.
 */
export const academyCacheTag = (userId: string): string => `academy-${userId}`;

/**
 * Cache tag for the user's dashboard stats.
 * Invalidate after a typing session is submitted.
 */
export const dashboardCacheTag = (userId: string): string => `dashboard-${userId}`;
