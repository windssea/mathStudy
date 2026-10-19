import { hashPassword } from 'better-auth/crypto';

/** Operator-only provisioning. This module is never imported by the public Worker. */
export async function builtInAccountSeed(username: string, password: string) {
  if (!/^[a-z][a-z0-9_-]{2,31}$/.test(username) || password.length < 10 || password.length > 128)
    throw new Error('Invalid built-in account configuration');
  const id = `builtin-${username}`,
    email = `${username}@mathstudy.internal`;
  const hash = await hashPassword(password),
    now = new Date().toISOString();
  const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
  return [
    `INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(${literal(id)},${literal(username)},${literal(email)},0,${literal(now)},${literal(now)}) ON CONFLICT(id) DO NOTHING;`,
    `INSERT INTO account(id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES(${literal(id + '-credential')},${literal(id)},'credential',${literal(id)},${literal(hash)},${literal(now)},${literal(now)}) ON CONFLICT(id) DO NOTHING;`,
    `INSERT INTO built_in_accounts(username,user_id) VALUES(${literal(username)},${literal(id)}) ON CONFLICT(username) DO NOTHING;`,
  ].join('\n');
}
