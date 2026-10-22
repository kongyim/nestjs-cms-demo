export type Identity = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
};

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      'X-CMS-Request': '1',
      ...options?.headers,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login')
      window.dispatchEvent(new Event('auth-expired'));
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}
