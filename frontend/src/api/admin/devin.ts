import { apiClient } from '../client'

export interface DevinAuthSession {
  auth_url: string
  session_id: string
  state: string
}

export interface DevinTokenInfo {
  access_token: string
  user_name?: string
  user_id?: string
  org_id?: string
}

export async function generateAuthUrl(proxyId?: number | null): Promise<DevinAuthSession> {
  const { data } = await apiClient.post<DevinAuthSession>('/admin/devin/oauth/auth-url', {
    ...(proxyId ? { proxy_id: proxyId } : {})
  })
  return data
}

export async function exchangeCode(sessionId: string, code: string, state: string): Promise<DevinTokenInfo> {
  const { data } = await apiClient.post<DevinTokenInfo>('/admin/devin/oauth/exchange-code', {
    session_id: sessionId, code, state
  }, { timeout: 90_000 })
  return data
}
