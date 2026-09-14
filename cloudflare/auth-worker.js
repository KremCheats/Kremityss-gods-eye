const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const ACCOUNT_PREFIX = 'account:';
const EMAIL_PREFIX = 'email:';
const SESSION_PREFIX = 'session:';

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', ...extra },
});

const corsHeaders = (request) => ({
  'access-control-allow-origin': request.headers.get('Origin') || 'https://kremdevai.com',
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'vary': 'Origin',
});

const base64Url = (bytes) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const randomId = (size = 24) => base64Url(crypto.getRandomValues(new Uint8Array(size)));

const derivePassword = async (password, salt) => {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  // The random salt is already high-entropy base64url text. Keeping it as
  // UTF-8 avoids runtime-specific base64 decoding differences at the edge.
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' }, material, 256);
  return base64Url(new Uint8Array(bits));
};

const readBody = async (request) => {
  try { return await request.json(); } catch { return null; }
};

const validEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
const validPassword = (value) => typeof value === 'string' && value.length >= 8 && value.length <= 128;
const cookie = (request) => request.headers.get('Cookie')?.match(/(?:^|;\s*)krem_session=([^;]+)/)?.[1];

const response = (request, body, status = 200, headers = {}) => json(body, status, { ...corsHeaders(request), ...headers });

async function currentUser(request, env) {
  const token = cookie(request);
  if (!token) return null;
  const session = await env.AUTH_KV.get(`${SESSION_PREFIX}${token}`, 'json');
  if (!session?.accountId) return null;
  const account = await env.AUTH_KV.get(`${ACCOUNT_PREFIX}${session.accountId}`, 'json');
  return account ? { id: account.id, email: account.email, createdAt: account.createdAt } : null;
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    try {
      if (request.method === 'GET' && path === '/health') return response(request, { ok: true, service: 'kremityss-auth' });
      if (request.method === 'GET' && path === '/api/auth/me') return response(request, { user: await currentUser(request, env) });
      if (request.method === 'POST' && path === '/api/auth/signup') {
        const body = await readBody(request);
        const email = body?.email?.trim().toLowerCase();
        const password = body?.password;
        if (!validEmail(email) || !validPassword(password)) return response(request, { error: 'Use a valid email and a password of at least 8 characters.' }, 400);
        const existing = await env.AUTH_KV.get(`${EMAIL_PREFIX}${email}`);
        if (existing) return response(request, { error: 'An account with that email already exists.' }, 409);
        const id = randomId(16);
        const salt = randomId(16);
        const account = { id, email, salt, passwordHash: await derivePassword(password, salt), createdAt: new Date().toISOString() };
        await env.AUTH_KV.put(`${ACCOUNT_PREFIX}${id}`, JSON.stringify(account));
        await env.AUTH_KV.put(`${EMAIL_PREFIX}${email}`, id);
        return await createSession(request, env, account);
      }
      if (request.method === 'POST' && path === '/api/auth/login') {
        const body = await readBody(request);
        const email = body?.email?.trim().toLowerCase();
        const password = body?.password;
        const id = validEmail(email) ? await env.AUTH_KV.get(`${EMAIL_PREFIX}${email}`) : null;
        const account = id ? await env.AUTH_KV.get(`${ACCOUNT_PREFIX}${id}`, 'json') : null;
        if (!account || !validPassword(password) || await derivePassword(password, account.salt) !== account.passwordHash) return response(request, { error: 'Email or password is incorrect.' }, 401);
        return await createSession(request, env, account);
      }
      if (request.method === 'POST' && path === '/api/auth/logout') {
        const token = cookie(request);
        if (token) await env.AUTH_KV.delete(`${SESSION_PREFIX}${token}`);
        return response(request, { ok: true }, 200, { 'set-cookie': 'krem_session=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=None' });
      }
      return response(request, { error: 'Not found' }, 404);
    } catch (error) {
      console.error(error);
      return response(request, { error: 'Authentication service unavailable.' }, 500);
    }
  },
};

async function createSession(request, env, account) {
  const token = randomId(32);
  await env.AUTH_KV.put(`${SESSION_PREFIX}${token}`, JSON.stringify({ accountId: account.id }), { expirationTtl: SESSION_TTL_SECONDS });
  return response(request, { user: { id: account.id, email: account.email, createdAt: account.createdAt } }, 200, {
    'set-cookie': `krem_session=${token}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; Secure; HttpOnly; SameSite=None`,
  });
}
