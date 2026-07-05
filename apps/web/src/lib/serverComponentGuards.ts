/**
 * serverComponentGuards.ts
 *
 * PURPOSE:
 *   Any Next.js Server Component that fetches user-specific data MUST
 *   re-export `dynamic` from this file. This prevents Next.js from
 *   accidentally caching personalized pages at the CDN edge (Full Route Cache).
 *
 *   Without this, if a Server Component fetches user data and doesn't declare
 *   `force-dynamic`, Next.js may statically render it at build time and serve
 *   the same cached HTML to every user — a critical data-bleed vulnerability.
 *
 * CURRENT STATUS (2026-07):
 *   All user-facing pages are `'use client'` components — this vulnerability
 *   does NOT exist today. This file is a pre-emptive architectural guard for
 *   when Server Components are added for performance (e.g. SSR stats pages).
 *
 * USAGE in a Server Component:
 *   // Prevents CDN edge caching of user-specific data
 *   export { dynamic } from '@/lib/serverComponentGuards';
 *
 *   // OR equivalently:
 *   export const dynamic = 'force-dynamic';
 *
 * CACHE TAG CONVENTION:
 *   When using Next.js granular cache tags (`revalidateTag`), always prefix
 *   user-scoped tags with the user ID to prevent cross-user cache collisions.
 *
 *   Usage: revalidateTag(userCacheTag(userId))
 *   This ensures revalidating User A's cache never touches User B's data.
 */

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
