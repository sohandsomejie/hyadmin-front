import camelCase from 'lodash.camelcase';

const DEFAULT_BASE = '/api/v1';

function getBaseUrl(): string {
  // 优先 VITE_API_BASE，否则默认 /api/v1（由代理转发）
  const envBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  console.log((import.meta as any).env);
  return envBase?.replace(/\/$/, '') || DEFAULT_BASE;
}

function getToken(): string | undefined {
  try {
    const raw = localStorage.getItem('auth-store');
    if (!raw) return undefined;
    const obj = JSON.parse(raw);
    return obj?.state?.token || obj?.token;
  } catch {
    return undefined;
  }
}

// 递归转换对象所有 key 为 camelCase
function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamel(v)) as any;
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [camelCase(k), keysToCamel(v)])
    ) as T;
  }
  return obj;
}

export async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getBaseUrl();
  const url = base + path;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers as any) } });
  if (!res.ok) {
    // if (res.status === 401) {
    //   try { localStorage.removeItem('auth-store'); } catch {}
    //   if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    //     window.location.href = '/login';
    //   }
    // }
    let err: any = undefined;
    try { err = await res.json(); } catch { /* noop */ }
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  const data = await res.json();
  return keysToCamel<T>(data);
}


