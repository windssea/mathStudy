import { betterAuth, type BetterAuthOptions } from 'better-auth';
import type { D1Database } from '@cloudflare/workers-types';
import type { ContentDatabase } from './content-repository';

export function authOptions(
  database: BetterAuthOptions['database'],
  secret: string,
  baseURL: string,
): BetterAuthOptions {
  return {
    appName: '数趣 MathStudy',
    baseURL,
    basePath: '/api/auth',
    secret,
    database,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 10 },
        '/sign-up/email': { window: 600, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: 'mathstudy',
      useSecureCookies: baseURL.startsWith('https:'),
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      database: { validateSchema: false },
    },
    trustedOrigins: [baseURL],
    telemetry: { enabled: false },
  };
}
const instances = new WeakMap<ContentDatabase, Map<string, ReturnType<typeof betterAuth>>>();
export function getAuth(env: { DB?: ContentDatabase; AUTH_SECRET?: string }, url: string) {
  if (!env.DB || !env.AUTH_SECRET || env.AUTH_SECRET.length < 32)
    throw new Error('Authentication is not configured');
  const origin = new URL(url).origin;
  if (
    ![
      'https://mathstudy.windssea526.workers.dev',
      'http://127.0.0.1:5188',
      'http://localhost:5188',
      'http://127.0.0.1:4173',
      'http://localhost',
    ].includes(origin)
  )
    throw new Error('Unexpected authentication origin');
  let byOrigin = instances.get(env.DB);
  if (!byOrigin) {
    byOrigin = new Map();
    instances.set(env.DB, byOrigin);
  }
  const key = origin + env.AUTH_SECRET;
  let auth = byOrigin.get(key);
  if (!auth) {
    auth = betterAuth(authOptions(env.DB as unknown as D1Database, env.AUTH_SECRET, origin));
    byOrigin.set(key, auth);
  }
  return auth;
}
export async function sessionUser(
  env: { DB?: ContentDatabase; AUTH_SECRET?: string },
  request: Request,
  setCookie?: (value: string) => void,
) {
  if (!request.headers.get('cookie')?.includes('mathstudy')) return null;
  const result = await getAuth(env, request.url).api.getSession({
    headers: request.headers,
    returnHeaders: true,
  });
  for (const cookie of result.headers.getSetCookie()) setCookie?.(cookie);
  const session = result.response;
  if (!session?.user || !env.DB) return null;
  const allowed = await env.DB.batch<{ username: string }>([
    env.DB.prepare('SELECT username FROM built_in_accounts WHERE user_id=? AND enabled=1').bind(
      session.user.id,
    ),
  ]);
  return allowed[0]?.results[0]
    ? { id: session.user.id, name: session.user.name, email: session.user.email }
    : null;
}

export async function builtInEmail(db: ContentDatabase, username: string) {
  const result = await db.batch<{ email: string }>([
    db
      .prepare(
        'SELECT u.email FROM built_in_accounts b JOIN user u ON u.id=b.user_id WHERE b.username=? AND b.enabled=1',
      )
      .bind(username),
  ]);
  return result[0]?.results[0]?.email ?? 'not-an-enabled-account@mathstudy.internal';
}
