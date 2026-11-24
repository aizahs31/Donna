// Per-browser Google Calendar session.
//
// The backend gives each user an opaque session token (their Google refresh token, encrypted).
// It is kept in localStorage and sent as "Authorization: Bearer <token>" on API calls.
import { API_URL } from '../config';

const TOKEN_KEY = 'donna-session';
const STATE_KEY = 'donna-oauth-state';
export const AUTH_CHANGED_EVENT = 'authChanged';

const safeGet = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const safeSet = (storage, key, value) => { try { storage.setItem(key, value); } catch { /* storage blocked */ } };
const safeRemove = (storage, key) => { try { storage.removeItem(key); } catch { /* storage blocked */ } };

export const getSessionToken = () => safeGet(localStorage, TOKEN_KEY);
export const isConnected = () => !!getSessionToken();

const notify = () => window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));

const setSessionToken = (token) => { safeSet(localStorage, TOKEN_KEY, token); notify(); };

export const clearSession = () => {
  if (!getSessionToken()) return;
  safeRemove(localStorage, TOKEN_KEY);
  notify();
};

const randomState = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Start Google sign-in. `state` lets us confirm the redirect back belongs to this browser.
export const startLogin = () => {
  const state = randomState();
  safeSet(sessionStorage, STATE_KEY, state);
  window.location.href = `${API_URL}/auth?state=${encodeURIComponent(state)}`;
};

// fetch() wrapper that attaches the session token and clears it if the backend rejects it.
export const apiFetch = async (path, options = {}) => {
  const token = getSessionToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) clearSession();
  return res;
};

export const logout = async () => {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout request failed', e);
  }
  clearSession();
};

// Finish a login redirect: /workspace#login_code=...&state=...  (or #auth_error=...)
// Runs once on page load; callers can await `authReady` before their first API call.
const completeLogin = async () => {
  const hash = window.location.hash.slice(1);
  if (!hash) return { status: 'none' };
  const params = new URLSearchParams(hash);
  const loginCode = params.get('login_code');
  const authError = params.get('auth_error');
  if (!loginCode && !authError) return { status: 'none' };

  // Remove the code from the address bar and history straight away
  window.history.replaceState(null, '', window.location.pathname + window.location.search);

  const expectedState = safeGet(sessionStorage, STATE_KEY);
  safeRemove(sessionStorage, STATE_KEY);

  if (authError) return { status: 'error', error: authError };
  if (!expectedState || params.get('state') !== expectedState) {
    // Not started from this browser: possible login CSRF. Ignore it.
    return { status: 'error', error: 'state_mismatch' };
  }

  try {
    const res = await fetch(`${API_URL}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: loginCode }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) return { status: 'error', error: data.error || 'exchange_failed' };
    setSessionToken(data.token);
    return { status: 'connected' };
  } catch (e) {
    console.error('Completing login failed', e);
    return { status: 'error', error: 'network_error' };
  }
};

export const authReady = completeLogin();
