import { Request, Response } from 'express';
import type { AuthTokens } from '@keystra/shared';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

export function handleOAuthCallback(req: Request, res: Response) {
  const userTokens = req.user as (AuthTokens & { userId: string }) | undefined;

  if (!userTokens) {
    return res.redirect(`${FRONTEND_URL}/login?error=OAuthFailed`);
  }

  // Redirect to frontend with tokens in the URL hash fragment.
  // URL hashes are NOT sent to the server in subsequent requests,
  // so they are safer than query parameters which end up in server access logs.
  const hash = new URLSearchParams({
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    expiresIn: userTokens.expiresIn.toString(),
  }).toString();

  res.redirect(`${FRONTEND_URL}/oauth/callback#${hash}`);
}
