import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/app', () => ({ useAppStore: () => ({ showError: vi.fn() }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/api/admin/devin', () => ({ generateAuthUrl: vi.fn(), exchangeCode: vi.fn() }))

import * as api from '@/api/admin/devin'
import { useDevinOAuth } from '../useDevinOAuth'

describe('Devin OAuth session lifecycle', () => {
  beforeEach(() => vi.resetAllMocks())

  it('sends the complete callback URL and session state for server-side verification', async () => {
    vi.mocked(api.generateAuthUrl).mockResolvedValue({ auth_url: 'https://app.devin.ai/auth', session_id: 'session', state: 'expected' })
    vi.mocked(api.exchangeCode).mockResolvedValue({ access_token: 'session-token', user_id: 'u1' })
    const oauth = useDevinOAuth()
    await oauth.generateAuthUrl(9)
    const callback = 'http://127.0.0.1:1234/callback?code=code&state=unexpected'
    const result = await oauth.exchangeAuthCode(callback)
    expect(api.generateAuthUrl).toHaveBeenCalledWith(9)
    expect(api.exchangeCode).toHaveBeenCalledWith('session', callback, 'expected')
    expect(oauth.buildCredentials(result!)).toEqual({ access_token: 'session-token', user_id: 'u1' })
  })

  it('ignores a stale authorization response after switching platform or closing the form', async () => {
    let resolve!: (value: api.DevinAuthSession) => void
    vi.mocked(api.generateAuthUrl).mockImplementation(() => new Promise(r => { resolve = r }))
    const oauth = useDevinOAuth()
    const pending = oauth.generateAuthUrl()
    oauth.resetState()
    resolve({ auth_url: 'old', session_id: 'old', state: 'old' })
    expect(await pending).toBe(false)
    expect(oauth.sessionId.value).toBe('')
    expect(oauth.loading.value).toBe(false)
  })

  it('prevents simultaneous duplicate code exchanges', async () => {
    vi.mocked(api.generateAuthUrl).mockResolvedValue({ auth_url: 'url', session_id: 'session', state: 'state' })
    let resolve!: (value: api.DevinTokenInfo) => void
    vi.mocked(api.exchangeCode).mockImplementation(() => new Promise(r => { resolve = r }))
    const oauth = useDevinOAuth()
    await oauth.generateAuthUrl()
    const pending = oauth.exchangeAuthCode('code')
    expect(await oauth.exchangeAuthCode('code')).toBeNull()
    resolve({ access_token: 'token' })
    await pending
    expect(api.exchangeCode).toHaveBeenCalledTimes(1)
  })
})
