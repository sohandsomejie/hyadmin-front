import camelCase from 'lodash.camelcase';

const DEFAULT_BASE = '/api/v1';
const DEFAULT_BASE_IMG = '/uploads';
function getBaseUrl(): string {
  // 优先 VITE_API_BASE，否则默认 /api/v1（由代理转发）
  const envBase = (import.meta as unknown as { env?: Record<string, unknown> }).env?.['VITE_API_BASE'] as string | undefined;
  return envBase?.replace(/\/$/, '') || DEFAULT_BASE;
}
function getBaseImgUrl(): string {
  // 优先 VITE_IMAGE_BASE，其次兼容 VITE_API_BASE_IMG
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env || {};
  const envBase = (env['VITE_IMAGE_BASE'] as string | undefined) || (env['VITE_API_BASE_IMG'] as string | undefined);
  return envBase?.replace(/\/$/, '') || DEFAULT_BASE_IMG;
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
function keysToCamel<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return (obj as unknown[]).map(v => keysToCamel(v)) as unknown as T;
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [camelCase(k), keysToCamel(v)])
    ) as unknown as T;
  }
  return obj as T;
}

export async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getBaseUrl();
  const url = base + path;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers as Record<string, string>) } });
  if (!res.ok) {
    // if (res.status === 401) {
    //   try { localStorage.removeItem('auth-store'); } catch {}
    //   if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    //     window.location.href = '/login';
    //   }
    // }
    let err: unknown = undefined;
    try { err = await res.json(); } catch { /* noop */ }
    type ErrorShape = { error?: { message?: string } };
    const message = (err && typeof err === 'object' && 'error' in (err as ErrorShape)) ? (err as ErrorShape).error?.message : undefined;
    throw new Error(message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  const data = await res.json();
  return keysToCamel<T>(data);
}

// multipart/form-data 助手（用于文件上传等；自动拼接 base 与 Authorization）
export async function httpMultipart<T>(path: string, form: FormData, options: { method?: 'POST'|'PUT' } = {}): Promise<T> {
  const base = getBaseUrl();
  const url = base + path;
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: options.method || 'POST', body: form, headers });
  if (!res.ok) {
    let err: unknown = undefined;
    try { err = await res.json(); } catch { /* noop */ }
    type ErrorShape = { error?: { message?: string } };
    const message = (err && typeof err === 'object' && 'error' in (err as ErrorShape)) ? (err as ErrorShape).error?.message : undefined;
    throw new Error(message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  const data = await res.json();
  return keysToCamel<T>(data);
}

// 将后端返回的相对文件路径（如 /uploads/xxx.png）拼接为完整可访问地址
export function resolveFileUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) return '';
  const val = String(pathOrUrl);

  if (/^https?:\/\//i.test(val)) return val;
  const base = getBaseImgUrl();
  if (/^https?:\/\//i.test(base)) {
    try {
      return `${base}${val.startsWith('/') ? '' : '/'}${val}`;
    } catch {
      return val;
    }
  }
  // 回退：同域相对路径
  return val;
}


