import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import * as devin from '@/api/admin/devin'
import { extractApiErrorMessage } from '@/utils/apiError'

export function useDevinOAuth() {
  const { t } = useI18n()
  const appStore = useAppStore()
  const authUrl = ref('')
  const sessionId = ref('')
  const state = ref('')
  const loading = ref(false)
  const error = ref('')
  let generation = 0

  const resetState = () => {
    generation++
    authUrl.value = sessionId.value = state.value = error.value = ''
    loading.value = false
  }

  const generateAuthUrl = async (proxyId?: number | null): Promise<boolean> => {
    resetState()
    const current = generation
    loading.value = true
    try {
      const result = await devin.generateAuthUrl(proxyId)
      if (current !== generation) return false
      authUrl.value = result.auth_url
      sessionId.value = result.session_id
      state.value = result.state
      return true
    } catch (err) {
      if (current === generation) {
        error.value = extractApiErrorMessage(err, t('admin.accounts.oauth.devin.failedToGenerateUrl'))
        appStore.showError(error.value)
      }
      return false
    } finally { if (current === generation) loading.value = false }
  }

  const exchangeAuthCode = async (code: string): Promise<devin.DevinTokenInfo | null> => {
    if (!code.trim() || !sessionId.value || !state.value || loading.value) return null
    const current = generation
    loading.value = true
    error.value = ''
    try {
      const info = await devin.exchangeCode(sessionId.value, code.trim(), state.value)
      return current === generation ? info : null
    } catch (err) {
      if (current === generation) {
        error.value = extractApiErrorMessage(err, t('admin.accounts.oauth.authFailed'))
        appStore.showError(error.value)
      }
      return null
    } finally { if (current === generation) loading.value = false }
  }

  const buildCredentials = (info: devin.DevinTokenInfo): Record<string, unknown> => ({
    access_token: info.access_token,
    ...(info.user_name ? { user_name: info.user_name } : {}),
    ...(info.user_id ? { user_id: info.user_id } : {}),
    ...(info.org_id ? { org_id: info.org_id } : {})
  })

  return { authUrl, sessionId, state, loading, error, resetState, generateAuthUrl, exchangeAuthCode, buildCredentials }
}
