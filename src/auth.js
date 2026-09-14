const AUTH_ORIGIN = import.meta.env.VITE_AUTH_ORIGIN || 'https://auth.kremdevai.com';

const api = async (path, options = {}) => {
  const response = await fetch(`${AUTH_ORIGIN}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Authentication request failed.');
  return payload;
};

const html = String.raw;

export function mountAuthGate({ onAuthenticated }) {
  const host = document.createElement('div');
  host.id = 'krem-auth-gate';
  host.innerHTML = html`
    <div class="auth-orientation-note" role="status">Rotate your phone to landscape for the full Kremityss command view.</div>
    <section class="auth-card" aria-labelledby="auth-title">
      <div class="auth-brand"><span class="auth-brand-mark">K</span><span>KREMITYSS</span></div>
      <p class="auth-eyebrow">GOD'S EYE VIEW · SECURE ACCESS</p>
      <h1 id="auth-title">Enter the command view.</h1>
      <p class="auth-copy">Sign in to continue to your branded Kremityss live globe.</p>
      <form id="auth-form">
        <label>Email<input name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required /></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" placeholder="8+ characters" minlength="8" required /></label>
        <button class="auth-submit" type="submit"><span>Continue</span><span aria-hidden="true">↗</span></button>
      </form>
      <button class="auth-switch" type="button" id="auth-switch">Need an account? Create one</button>
      <p class="auth-status" id="auth-status" role="alert" aria-live="polite"></p>
      <p class="auth-footnote">Protected by Kremityss edge sessions · works on iPhone and Android</p>
    </section>`;
  document.body.prepend(host);
  const form = host.querySelector('#auth-form');
  const submit = host.querySelector('.auth-submit');
  const switchButton = host.querySelector('#auth-switch');
  const status = host.querySelector('#auth-status');
  let mode = 'login';
  const setMode = () => {
    mode = mode === 'login' ? 'signup' : 'login';
    form.querySelector('input[type="password"]').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    submit.querySelector('span').textContent = mode === 'login' ? 'Continue' : 'Create account';
    switchButton.textContent = mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in';
    host.querySelector('#auth-title').textContent = mode === 'login' ? 'Enter the command view.' : 'Create your command access.';
  };
  switchButton.addEventListener('click', setMode);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    submit.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      const result = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(data) });
      host.remove();
      onAuthenticated(result.user);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
  return api('/api/auth/me').then(({ user }) => {
    if (user) { host.remove(); onAuthenticated(user); }
    return user;
  }).catch(() => null);
}

export async function logout() {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.reload();
}
