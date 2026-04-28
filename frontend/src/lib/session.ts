export const TOKEN_KEY = 'kickoff_token';

export function getToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
}
export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function facilitiesToList(input: string) {
  return input
    .split(/[\n,]/)
    .map((facility) => facility.trim())
    .filter(Boolean);
}

export function listToFacilities(input: string[] | null | undefined) {
  return input?.join(', ') || '';
}
