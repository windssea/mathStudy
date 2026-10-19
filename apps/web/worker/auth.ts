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
    emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128 },
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
) {
  if (!request.headers.get('cookie')?.includes('mathstudy')) return null;
  const result = await getAuth(env, request.url).api.getSession({ headers: request.headers });
  return result?.user
    ? { id: result.user.id, name: result.user.name, email: result.user.email }
    : null;
}
