const BASE = '/teqnika-ngrok/api'

function getToken(): string | null {
  const s = localStorage.getItem('teknika_session')
  if (!s) return null
  try { return JSON.parse(s).token } catch { return null }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Server error')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get:    <T>(path: string)              => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)              => request<T>('DELETE', path),
}

export function buildExcelUrl(path: string, params: Record<string, string | number | undefined>): string {
  const token = getToken()
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v))
  }
  if (token) qs.set('_token', token)
  return `${BASE}${path}?${qs.toString()}`
}
