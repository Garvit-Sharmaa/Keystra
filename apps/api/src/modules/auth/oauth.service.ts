import { pool }          from '../../config/database';
import { issueTokenPair } from '../../utils/jwt';
import type { AuthTokens } from '@keystra/shared';

interface OAuthProfile {
  provider: 'google' | 'github';
  oauthId:  string;
  email:    string;
  username: string;   // derived from displayName / login
  avatarUrl?: string;
}

/**
 * Find-or-create an OAuth user.
 * - First checks by (oauth_provider, oauth_id) — the most stable lookup.
 * - Falls back to email match to link existing local accounts.
 * - Creates a brand-new user if neither matches.
 */
export async function findOrCreateOAuthUser(
  profile: OAuthProfile,
): Promise<AuthTokens & { userId: string }> {
  const { provider, oauthId, email, username, avatarUrl } = profile;
  const emailLower = email.toLowerCase();

  // 1. Look up by oauth_provider + oauth_id
  const byOAuth = await pool.query<{
    id: string; email: string; username: string; rank: string;
  }>(
    `SELECT u.id, u.email, u.username,
            COALESCE(s.rank, 'bronze') AS rank
     FROM users u
     LEFT JOIN user_statistics s ON s.user_id = u.id
     WHERE u.oauth_provider = $1 AND u.oauth_id = $2
     LIMIT 1`,
    [provider, oauthId],
  );

  if (byOAuth.rows.length) {
    const user = byOAuth.rows[0];
    const tokens = issueTokenPair(user as any);
    return { ...tokens, userId: user.id };
  }

  // 2. Email already registered (local account) → link OAuth to it
  const byEmail = await pool.query<{
    id: string; username: string; rank: string;
  }>(
    `SELECT u.id, u.username,
            COALESCE(s.rank, 'bronze') AS rank
     FROM users u
     LEFT JOIN user_statistics s ON s.user_id = u.id
     WHERE u.email = $1 AND u.is_active = true
     LIMIT 1`,
    [emailLower],
  );

  if (byEmail.rows.length) {
    const user = byEmail.rows[0];
    // Link the OAuth provider to the existing account
    await pool.query(
      `UPDATE users
       SET oauth_provider = $1, oauth_id = $2, avatar_url = COALESCE(avatar_url, $3), updated_at = NOW()
       WHERE id = $4`,
      [provider, oauthId, avatarUrl ?? null, user.id],
    );
    const tokens = issueTokenPair({
      id: user.id, email: emailLower, username: user.username, rank: user.rank as any,
    });
    return { ...tokens, userId: user.id };
  }

  // 3. Brand-new user — generate a unique username if taken
  let finalUsername = username.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30) || `user${Date.now()}`;
  const taken = await pool.query('SELECT 1 FROM users WHERE username = $1', [finalUsername]);
  if (taken.rows.length) finalUsername = `${finalUsername}${Math.floor(Math.random() * 9999)}`;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users (email, username, oauth_provider, oauth_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [emailLower, finalUsername, provider, oauthId, avatarUrl ?? null],
  );
  const newUser = rows[0];

  // Bootstrap statistics + streak rows
  await pool.query(
    'INSERT INTO user_statistics (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [newUser.id],
  );
  await pool.query(
    'INSERT INTO user_streaks (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [newUser.id],
  );

  const tokens = issueTokenPair({
    id: newUser.id, email: emailLower, username: finalUsername, rank: 'bronze',
  });
  return { ...tokens, userId: newUser.id };
}
