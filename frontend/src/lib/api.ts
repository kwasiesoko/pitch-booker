const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || DEFAULT_API_URL;
}

export function apiUrl(path: string) {
  return new URL(path.replace(/^\//, ''), `${getApiBaseUrl()}/`).toString();
}
