import { api } from './client'
import type { Session } from '../types'

interface AuthResponse {
  token: string
  site_id: number | null
  site_name: string
  is_admin: boolean
}

export async function verifySite(code: string): Promise<Session> {
  const res = await api.post<AuthResponse>('/auth/verify', { code })
  const session: Session = {
    token: res.token,
    siteId: res.site_id,
    siteName: res.site_name,
    isAdmin: res.is_admin,
  }
  localStorage.setItem('teknika_session', JSON.stringify(session))
  return session
}

export function getSession(): Session | null {
  const s = localStorage.getItem('teknika_session')
  if (!s) return null
  try { return JSON.parse(s) } catch { return null }
}

export function clearSession(): void {
  localStorage.removeItem('teknika_session')
}
