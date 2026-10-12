import { browser } from 'wxt/browser';

/**
 * Phase 0 only needs `drive.file`: access limited to files this extension
 * creates. Gmail / Calendar scopes are added in later phases.
 */
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const TOKEN_KEY = 'auth.token';
const EXPIRY_SKEW_MS = 60_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

export const getRedirectUrl = (): string => browser.identity.getRedirectURL();

export function buildAuthUrl(clientId: string, redirectUri: string, interactive: boolean): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPES.join(' '),
    include_granted_scopes: 'true',
    // prompt=none lets us refresh silently when the user has already consented.
    ...(interactive ? {} : { prompt: 'none' }),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function parseTokenFromRedirect(responseUrl: string): CachedToken {
  const fragment = new URL(responseUrl).hash.replace(/^#/, '');
  const params = new URLSearchParams(fragment);
  const error = params.get('error');
  if (error) throw new Error(`Google sign-in failed: ${error}`);
  const accessToken = params.get('access_token');
  const expiresIn = Number(params.get('expires_in') ?? '0');
  if (!accessToken) throw new Error('Google sign-in returned no access token.');
  return { accessToken, expiresAt: Date.now() + expiresIn * 1000 };
}

/**
 * Returns a valid access token. Uses the cached one when still fresh,
 * otherwise runs the OAuth flow (silently when `interactive` is false).
 */
export async function getAccessToken(interactive = true): Promise<string> {
  const stored = (await browser.storage.local.get(TOKEN_KEY))[TOKEN_KEY] as CachedToken | undefined;
  if (stored && stored.expiresAt - EXPIRY_SKEW_MS > Date.now()) return stored.accessToken;

  const clientId = import.meta.env.WXT_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    throw new Error('Missing WXT_GOOGLE_CLIENT_ID. Copy .env.example to .env and set it.');
  }

  const responseUrl = await browser.identity.launchWebAuthFlow({
    url: buildAuthUrl(clientId, getRedirectUrl(), interactive),
    interactive,
  });
  if (!responseUrl) throw new Error('Sign-in was cancelled.');

  const token = parseTokenFromRedirect(responseUrl);
  await browser.storage.local.set({ [TOKEN_KEY]: token });
  return token.accessToken;
}

export async function signOut(): Promise<void> {
  const stored = (await browser.storage.local.get(TOKEN_KEY))[TOKEN_KEY] as CachedToken | undefined;
  if (stored) {
    // Best effort: revoke at Google, then drop the local copy either way.
    await fetch(`https://oauth2.googleapis.com/revoke?token=${stored.accessToken}`, {
      method: 'POST',
    }).catch(() => undefined);
  }
  await browser.storage.local.remove(TOKEN_KEY);
}
