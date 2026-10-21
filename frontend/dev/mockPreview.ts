import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type RecordData = Record<string, any>
const DAY = 86_400_000
const now = new Date()
const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
const timestamp = (offset = 0) => new Date(dayStart + offset).toISOString()
const number = (value: unknown) => Number(value) || 0
const money = (value: number) => Number(value.toFixed(6))
const modelNames = ['claude-sonnet-4-5', 'gpt-5', 'gemini-2.5-pro', 'deepseek-v3']
const platforms = ['anthropic', 'openai', 'gemini', 'deepseek']

const initialSettings: RecordData = {
  site_name: 'molly', site_logo: '/logo.png', site_subtitle: '统一的 AI API 接入平台',
  api_base_url: '', doc_url: '', registration_enabled: true, password_reset_enabled: true,
  subscription_enabled: true, payment_enabled: true, payment_balance_disabled: false,
  model_plaza_enabled: true, model_plaza_require_auth: false, affiliate_enabled: false,
  ops_monitoring_enabled: false, batch_image_enabled: false, announcement_enabled: true,
  hide_ccs_import_button: false, backend_mode_enabled: false, version: 'dev-preview',
  custom_menu_items: [], custom_endpoints: [], home_content: '', home_content_mode: 'default',
  feature_flags: {}, registration_email_suffix_whitelist: [], default_subscriptions: [],
  table_default_page_size: 20, table_page_size_options: [10, 20, 50, 100],
  login_agreement_enabled: false, login_agreement_documents: [], default_platform_quotas: {},
  account_scheduling_thresholds: {}, forwarded_client_ip_headers: [],
  payment_recharge_bonus_tiers: [], openai_fast_policy_settings: { rules: [] },
  default_balance: 20, default_concurrency: 5, smtp_host: '', smtp_port: 587, smtp_username: '', smtp_from: '',
}
const initialUsers: RecordData[] = ['Molly', 'Studio', 'Research', 'Personal'].map((name, index) => ({
  id: index + 1, username: name, email: `${name.toLowerCase()}@preview.example`,
  role: index === 0 ? 'admin' : 'user', balance: [128.64, 82.5, 61.25, 24.8][index],
  frozen_balance: 0, concurrency: 10, rpm_limit: 120, current_concurrency: index + 1,
  status: 'active', allowed_groups: [1, 2, 3, 4], notes: '本地演示账号',
  balance_notify_enabled: false, balance_notify_threshold: 10, balance_notify_extra_emails: [],
  subscriptions: [], auth_bindings: {}, created_at: timestamp(-90 * DAY), updated_at: timestamp(),
  last_active_at: timestamp(12 * 3_600_000), run_mode: 'standard',
}))
const initialGroups: RecordData[] = ['Claude 标准', 'OpenAI 高速', 'Gemini 长上下文', 'DeepSeek 通用'].map((name, index) => ({
  id: index + 1, name, description: '本地界面预览分组', platform: platforms[index],
  rate_multiplier: .8, rpm_limit: 120, is_exclusive: false, status: 'active', subscription_type: 'standard',
  daily_limit_usd: null, weekly_limit_usd: null, monthly_limit_usd: null,
  long_context_pricing_enabled: false, allow_image_generation: false, allow_batch_image_generation: false,
  image_rate_independent: false, image_rate_multiplier: 1, batch_image_discount_multiplier: 1,
  batch_image_hold_multiplier: 1, image_price_1k: null, image_price_2k: null, image_price_4k: null,
  video_rate_independent: false, video_rate_multiplier: 1, video_price_480p: null,
  video_price_720p: null, video_price_1080p: null, web_search_price_per_call: null,
  search_price_per_1k: null, audio_realtime_price_per_min: null, audio_tts_price_per_million_chars: null,
  audio_stt_price_per_hour: null, peak_rate_enabled: false, peak_start: '', peak_end: '', peak_rate_multiplier: 1,
  claude_code_only: false, fallback_group_id: null, fallback_group_id_on_invalid_request: null,
  allow_live: false, require_oauth_only: false, require_privacy_set: false, force_openai_fast: false,
  free_openai_fast: false, model_pricing: [], profit_control_enabled: false, profit_min_margin: 0,
  profit_safety_buffer: 0, model_routing: {}, model_routing_enabled: false, mcp_xml_inject: false,
  account_count: 3, active_account_count: 3, rate_limited_account_count: 0, sort_order: index,
  created_at: timestamp(-90 * DAY), updated_at: timestamp(),
}))
const initialKeys: RecordData[] = ['日常开发', '代码助手', '研究项目', '备用密钥', '团队工具', '移动端'].map((name, index) => ({
  id: index + 1, user_id: index < 4 ? 1 : 2, name, key: `sk-demo-local-only-${String(index + 1).padStart(12, '0')}`,
  group_id: index % 4 + 1, group: initialGroups[index % 4], status: index === 3 ? 'inactive' : 'active',
  ip_whitelist: [], ip_blacklist: [], last_used_at: timestamp(15 * 3_600_000), last_used_ip: '127.0.0.1',
  quota: 100, quota_used: money(index * 7.43), expires_at: null, current_concurrency: index % 2,
  rate_limit_5h: 0, rate_limit_1d: 0, rate_limit_7d: 0, usage_5h: 0, usage_1d: 0, usage_7d: 0,
  window_5h_start: null, window_1d_start: null, window_7d_start: null, reset_5h_at: null,
  reset_1d_at: null, reset_7d_at: null, created_at: timestamp(-30 * DAY), updated_at: timestamp(),
}))

// All summaries, chart series and detail rows derive from these deterministic requests.
const initialUsage: RecordData[] = []
for (let day = -30; day <= 0; day++) {
  for (let hour = 0; hour < 24; hour++) {
    if (day === 0 && hour > now.getUTCHours()) continue
    const volume = Math.max(3, Math.round(14 + 9 * Math.sin((hour - 7) / 3) + 5 * Math.sin((day + 30) * .8 + hour)))
    for (let slot = 0; slot < volume; slot++) {
      const seed = (day + 31) * 701 + hour * 37 + slot * 13
      const modelIndex = seed % 4
      const userId = slot % 5 < 3 ? 1 : slot % 5 - 1
      const input = 2400 + seed % 18000
      const output = 700 + seed % 4200
      const write = seed % 3 === 0 ? 2500 + seed % 6000 : 0
      const read = 7000 + seed % 38000
      const cost = money(input * .000003 + output * .000015 + write * .00000375 + read * .0000003)
      const key = initialKeys.find(item => item.user_id === userId && item.group_id === modelIndex + 1) || initialKeys[userId === 1 ? modelIndex : 4]
      const id = initialUsage.length + 1
      const endpoint = ['/v1/messages', '/v1/responses', '/v1/chat/completions', '/v1/chat/completions'][modelIndex]
      initialUsage.push({
        id, user_id: userId, api_key_id: key.id, account_id: modelIndex + 1,
        request_id: `preview-${String(id).padStart(8, '0')}`, model: modelNames[modelIndex],
        upstream_model: modelNames[modelIndex], upstream_response_model: modelNames[modelIndex],
        inbound_endpoint: endpoint, upstream_endpoint: endpoint, endpoint_path: endpoint,
        group_id: modelIndex + 1, subscription_id: null, input_tokens: input, output_tokens: output,
        cache_creation_tokens: write, cache_read_tokens: read, cache_creation_5m_tokens: write,
        cache_creation_1h_tokens: 0, total_tokens: input + output + write + read,
        input_cost: money(input * .000003), output_cost: money(output * .000015),
        cache_creation_cost: money(write * .00000375), cache_read_cost: money(read * .0000003),
        total_cost: cost, cost, actual_cost: money(cost * .8), account_cost: money(cost * .5),
        rate_multiplier: .8, long_context_billing_applied: false, billing_type: 0, billing_mode: 'token',
        request_type: slot % 4 === 0 ? 'sync' : 'stream', stream: slot % 4 !== 0, native_compaction_v2: false,
        duration_ms: 380 + seed % 2800, first_token_ms: 120 + seed % 480, image_count: 0,
        image_size: null, image_input_size: null, image_output_size: null, image_size_source: null,
        image_size_breakdown: null, image_input_tokens: 0, image_input_cost: 0, image_output_tokens: 0,
        image_output_cost: 0, user_agent: 'Molly Preview / 1.0', ip_address: '127.0.0.1',
        cache_ttl_overridden: false, created_at: timestamp(day * DAY + hour * 3_600_000 + slot * 60000),
        user: initialUsers[userId - 1], api_key: key, group: initialGroups[modelIndex],
        account: { id: modelIndex + 1, name: `${platforms[modelIndex]} 演示账号` },
      })
    }
  }
}

function aggregate(rows: RecordData[]) {
  const values = { requests: rows.length, input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0,
    cache_read_tokens: 0, total_tokens: 0, cost: 0, actual_cost: 0, account_cost: 0 }
  for (const row of rows) for (const key of Object.keys(values) as (keyof typeof values)[]) {
    if (key !== 'requests') values[key] += number(row[key])
  }
  values.cost = money(values.cost); values.actual_cost = money(values.actual_cost); values.account_cost = money(values.account_cost)
  return values
}
function grouped(rows: RecordData[], key: (row: RecordData) => string) {
  const buckets = new Map<string, RecordData[]>()
  for (const row of rows) { const value = key(row); const bucket = buckets.get(value) || []; bucket.push(row); buckets.set(value, bucket) }
  return Array.from(buckets).map(([value, records]) => ({ value, ...aggregate(records) }))
}
function dateBoundary(value: string | null, end = false) {
  if (!value) return end ? Infinity : -Infinity
  const parsed = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value)
  return Number.isFinite(parsed) ? parsed + (end && value.length === 10 ? DAY - 1 : 0) : end ? Infinity : -Infinity
}
const dateFormatters = new Map<string, Intl.DateTimeFormat>()
function zonedTimestamp(value: string | number, query = new URLSearchParams()) {
  const zone = query.get('timezone') || 'Asia/Shanghai'
  let formatter = dateFormatters.get(zone)
  if (!formatter) {
    try { formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) }
    catch { formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) }
    dateFormatters.set(zone, formatter)
  }
  return formatter.format(new Date(value))
}
function selectRows(query: URLSearchParams, admin: boolean) {
  const start = dateBoundary(query.get('start_date') || query.get('start_time'))
  const end = dateBoundary(query.get('end_date') || query.get('end_time'), true)
  const dateStart = query.get('start_date')
  const dateEnd = query.get('end_date')
  return initialUsage.filter(row => {
    const time = Date.parse(row.created_at)
    const localDate = zonedTimestamp(row.created_at, query).slice(0, 10)
    if ((!dateStart || dateStart.length !== 10) && time < start) return false
    if ((!dateEnd || dateEnd.length !== 10) && time > end) return false
    if (dateStart?.length === 10 && localDate < dateStart) return false
    if (dateEnd?.length === 10 && localDate > dateEnd) return false
    if (!admin && row.user_id !== 1) return false
    for (const key of ['user_id', 'api_key_id', 'group_id', 'account_id', 'model', 'request_type', 'billing_type', 'billing_mode']) {
      const filter = query.get(key)
      if (filter && String(row[key]) !== filter) return false
    }
    const stream = query.get('stream')
    return !stream || String(row.stream) === stream
  })
}
function paginate(items: RecordData[], query: URLSearchParams) {
  const page = Math.max(1, number(query.get('page')) || 1)
  const size = Math.min(1000, Math.max(1, number(query.get('page_size')) || 20))
  return { items: items.slice((page - 1) * size, page * size), total: items.length, page, page_size: size, pages: Math.ceil(items.length / size), total_pages: Math.ceil(items.length / size) }
}
function json(response: ServerResponse, data: unknown, status = 200) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Molly-Preview', 'mock-data')
  response.end(JSON.stringify(status < 400 ? { code: 0, data } : { code: status, message: data, reason: 'MOCK_ENDPOINT_UNAVAILABLE' }))
}
async function body(request: IncomingMessage): Promise<RecordData> {
  const parts: Buffer[] = []
  for await (const part of request) parts.push(Buffer.from(part))
  const content = Buffer.concat(parts).toString()
  if (!content) return {}
  return JSON.parse(content)
}

/** Server-only fixture. Installed exclusively by `vite --mode mock`, never an app import. */
export function mockPreview(): Plugin {
  const settings = structuredClone(initialSettings)
  const users = structuredClone(initialUsers)
  const groups = structuredClone(initialGroups)
  const keys = structuredClone(initialKeys)
  const extraSettings: Record<string, RecordData> = {
    '/admin/settings/overload-cooldown': { enabled: true, cooldown_minutes: 5 },
    '/admin/settings/rate-limit-429-cooldown': { enabled: true, cooldown_seconds: 60 },
    '/admin/settings/panel-rate-limit': { enabled: false, user_rpm: 300, heavy_rpm: 60, exempt_admin: true, public_ip_rpm: 120 },
    '/admin/settings/stream-timeout': { enabled: true, action: 'none', temp_unsched_minutes: 5, threshold_count: 3, threshold_window_minutes: 10 },
    '/admin/settings/rectifier': { enabled: false, thinking_signature_enabled: false, thinking_budget_enabled: false, apikey_signature_enabled: false, apikey_signature_patterns: [] },
    '/admin/settings/beta-policy': { rules: [] }, '/admin/settings/web-search-emulation': { enabled: false, providers: [] },
    '/admin/accounts/upstream-billing-probe/settings': { enabled: false, interval_seconds: 300, timeout_seconds: 15 },
    '/admin/accounts/ollama-cloud-usage/settings': { enabled: false, interval_seconds: 300 },
    '/admin/accounts/opencode-go-usage/settings': { enabled: false, interval_seconds: 300 },
    '/admin/backups/s3-config': { enabled: false, bucket: '', endpoint: '', region: '', prefix: '', access_key_id: '', secret_access_key: '', path_style: false },
    '/admin/backups/image-storage': { config: { enabled: false, storage_type: 'local', prefix: 'images/', retention_days: 30 }, effective: { enabled: false, storage_type: 'local' } },
    '/admin/backups/schedule': { enabled: false, cron: '0 3 * * *', retention_count: 7 },
  }
  const stats = (rows: RecordData[], query = new URLSearchParams()) => {
    const total = aggregate(rows)
    const today = aggregate(rows.filter(row => zonedTimestamp(row.created_at, query).slice(0, 10) === zonedTimestamp(now.getTime(), query).slice(0, 10)))
    const endpointStats = grouped(rows, row => row.inbound_endpoint).map(({ value, ...item }) => ({ endpoint: value, ...item }))
    return {
      ...Object.fromEntries(Object.entries(total).map(([key, value]) => [`total_${key === 'total_tokens' ? 'tokens' : key}`, value])),
      total_cache_tokens: total.cache_creation_tokens + total.cache_read_tokens,
      ...Object.fromEntries(Object.entries(today).map(([key, value]) => [`today_${key === 'total_tokens' ? 'tokens' : key}`, value])),
      total_api_keys: keys.length, active_api_keys: keys.filter(key => key.status === 'active').length,
      total_users: users.length, active_users: new Set(rows.map(row => row.user_id)).size, hourly_active_users: 2, today_new_users: 0,
      total_accounts: 12, normal_accounts: 11, error_accounts: 1, ratelimit_accounts: 0, overload_accounts: 0,
      average_duration_ms: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.duration_ms, 0) / rows.length) : 0,
      uptime: 86400 * 14, rpm: 24, tpm: 280000, stats_stale: false, stats_updated_at: new Date().toISOString(),
      endpoints: endpointStats, upstream_endpoints: endpointStats, endpoint_paths: endpointStats,
      by_platform: grouped(rows, row => row.group.platform).map(({ value, ...item }) => ({ platform: value, total_requests: item.requests, total_tokens: item.total_tokens, total_actual_cost: item.actual_cost, today_requests: 0, today_tokens: 0, today_actual_cost: 0 })),
    }
  }
  const analytics = (rows: RecordData[], query: URLSearchParams) => {
    const granularity = query.get('granularity') || 'day'
    const trend = grouped(rows, row => zonedTimestamp(row.created_at, query).slice(0, granularity === 'hour' ? 13 : 10) + (granularity === 'hour' ? ':00' : '')).map(({ value, ...item }) => ({ date: value, ...item }))
    const models = grouped(rows, row => row.model).map(({ value, ...item }) => ({ model: value, ...item }))
    const groupStats = grouped(rows, row => String(row.group_id)).map(({ value, ...item }) => ({ group_id: Number(value), group_name: groups.find(group => group.id === Number(value))?.name || value, ...item }))
    return { generated_at: new Date().toISOString(), start_date: query.get('start_date'), end_date: query.get('end_date'), granularity, stats: stats(rows, query), trend, models, groups: groupStats }
  }
  return {
    name: 'molly-mock-preview', apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const config = JSON.stringify(settings).replace(/</g, '\\u003c')
        const user = JSON.stringify(users[0]).replace(/</g, '\\u003c')
        const script = `<script>window.__APP_CONFIG__=${config};window.__MOCK_PREVIEW__=true;(()=>{const role=new URLSearchParams(location.search).get('demoRole');const saved=localStorage.getItem('molly_preview_role')||'admin';const selected=role==='user'||role==='admin'?role:saved;localStorage.setItem('molly_preview_role',selected);const user=${user};user.role=selected;localStorage.setItem('auth_token','molly-preview-'+selected);localStorage.setItem('auth_user',JSON.stringify(user));localStorage.setItem('refresh_token','molly-preview-'+selected);localStorage.setItem('token_expires_at',String(Date.now()+86400000));for(const key of ['user_guide_1_user_v4_interactive','admin_guide_1_admin_v4_interactive'])localStorage.setItem(key,'true');})();</script>`
        return html.replace(/<title>[^<]*<\/title>/, '<title>molly · 本地模拟预览</title>').replace(/<link\s+rel=["']icon["'][^>]*>/, '<link rel="icon" href="/logo.png" />').replace('</head>', `${script}</head>`)
      }
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url || '/', 'http://preview.local')
        if (!/^\/(api|v1)(\/|$)/.test(url.pathname) && !url.pathname.startsWith('/setup/')) return next()
        const path = url.pathname.replace(/^\/api\/v1/, '')
        const method = request.method || 'GET'
        const query = url.searchParams
        const admin = path.startsWith('/admin/')
        const rows = selectRows(query, admin)
        const currentUser = { ...users[0], role: String(request.headers.authorization).includes('preview-user') ? 'user' : 'admin' }
        try {
          const payload = method === 'GET' || method === 'HEAD' ? {} : await body(request)
          let data: unknown
          if (path === '/setup/status') data = { needs_setup: false, step: 'complete' }
          else if (path === '/settings/public') data = settings
          else if (path === '/auth/me' || path === '/user/profile') data = currentUser
          else if (path === '/auth/login' || path === '/auth/refresh') data = { user: currentUser, access_token: `molly-preview-${currentUser.role}`, refresh_token: `molly-preview-${currentUser.role}`, token_type: 'Bearer', expires_in: 86400 }
          else if (path === '/auth/logout') data = { message: '已退出演示账号' }
          else if (path === '/admin/settings') { if (method === 'PUT') Object.assign(settings, payload); data = settings }
          else if (extraSettings[path]) { if (method === 'PUT') Object.assign(extraSettings[path], payload); data = extraSettings[path] }
          else if ((path === '/admin/compliance' || path.includes('/compliance/'))) data = { required: false, version: 'local-preview', acknowledgement: null }
          else if (path.endsWith('/snapshot-v2')) data = analytics(rows, query)
          else if (path.endsWith('/users-trend')) data = { ...analytics(rows, query), trend: grouped(rows, row => `${zonedTimestamp(row.created_at, query).slice(0, 10)}|${row.user_id}`).map(({ value, ...item }) => { const [date, id] = value.split('|'); return { date, user_id: Number(id), username: users[Number(id) - 1]?.username, email: users[Number(id) - 1]?.email, ...item, tokens: item.total_tokens } }) }
          else if (path.endsWith('/trend') || path.endsWith('/models') || path === '/admin/dashboard/groups') data = analytics(rows, query)
          else if (path.endsWith('/users-ranking') || path.endsWith('/user-breakdown')) {
            const ranking = grouped(rows, row => String(row.user_id)).map(({ value, ...item }) => ({ user_id: Number(value), username: users[Number(value) - 1]?.username, email: users[Number(value) - 1]?.email, ...item, cache_tokens: item.cache_creation_tokens + item.cache_read_tokens, tokens: item.total_tokens })).sort((a, b) => b.actual_cost - a.actual_cost)
            const total = aggregate(rows); data = { ranking, users: ranking, total_actual_cost: total.actual_cost, total_requests: total.requests, total_tokens: total.total_tokens, start_date: query.get('start_date'), end_date: query.get('end_date') }
          }
          else if (/^\/(admin\/dashboard|admin\/usage|usage|usage\/dashboard)\/stats$/.test(path)) data = stats(rows, query)
          else if (path.endsWith('/api-keys-usage') || path.endsWith('/users-usage')) data = { stats: Object.fromEntries((path.endsWith('/users-usage') ? users : keys).map(item => [item.id, { user_id: item.id, api_key_id: item.id, ...stats(initialUsage.filter(row => row[path.endsWith('/users-usage') ? 'user_id' : 'api_key_id'] === item.id)) }])) }
          else if (path === '/usage' || path === '/admin/usage') {
            const sorted = [...rows].sort((a, b) => (query.get('sort_order') === 'asc' ? 1 : -1) * (Date.parse(a.created_at) - Date.parse(b.created_at)))
            data = paginate(sorted, query)
          }
          else if (/^\/(admin\/)?usage\/\d+$/.test(path)) data = initialUsage.find(row => row.id === Number(path.split('/').at(-1)))
          else if (path === '/usage/errors' || path === '/admin/usage/cleanup-tasks') data = paginate([], query)
          else if (path === '/admin/usage/search-users') data = users
          else if (path === '/admin/usage/search-api-keys') data = keys
          else if (path.endsWith('/platform-quotas')) data = { platform_quotas: [] }
          else if (path === '/subscriptions/summary') data = { active_count: 0, subscriptions: [], total_daily_limit_usd: 0, total_daily_usage_usd: 0 }
          else if (/^\/subscriptions(?:\/active|\/progress)?$/.test(path) || path === '/announcements') data = []
          else if (path === '/admin/settings/admin-api-key') data = { exists: false }
          else if (path === '/admin/settings/email-templates') data = { events: [], locales: ['zh', 'en'], templates: [], placeholders: [] }
          else if (path === '/admin/system/check-updates' || path.endsWith('/version')) data = { version: 'dev-preview', latest_version: 'dev-preview', has_update: false, build_type: 'source' }
          else if (path === '/groups/available' || path === '/admin/groups/all') data = groups
          else if ((path === '/groups/rates' || path === '/groups/rate-multipliers')) data = {}
          else if (path === '/admin/groups/live-capability') data = { enabled: false, platforms: [] }
          else if (/^\/admin\/groups\/\d+\/model-allowlist-candidates$/.test(path)) data = { models: modelNames.filter((_model, index) => !query.get('platform') || platforms[index] === query.get('platform')) }
          else if (path === '/admin/groups/usage-summary') data = groups.map(group => {
            const groupRows = initialUsage.filter(row => row.group_id === group.id)
            const today = zonedTimestamp(now.getTime(), query).slice(0, 10)
            const yesterday = zonedTimestamp(now.getTime() - DAY, query).slice(0, 10)
            return { group_id: group.id, today_cost: aggregate(groupRows.filter(row => zonedTimestamp(row.created_at, query).slice(0, 10) === today)).actual_cost, yesterday_cost: aggregate(groupRows.filter(row => zonedTimestamp(row.created_at, query).slice(0, 10) === yesterday)).actual_cost, total_cost: aggregate(groupRows).actual_cost }
          })
          else if (path === '/admin/groups/capacity-summary') data = groups.map(group => ({ group_id: group.id, concurrency_used: 0, concurrency_max: 30, sessions_used: 0, sessions_max: 100, rpm_used: 0, rpm_max: 120 }))
          else if (path === '/admin/user-attributes') data = []
          else if (path === '/admin/payment/providers' || path === '/admin/payment/channels' || path === '/admin/payment/plans') data = []
          else if (path === '/admin/payment/config') data = { enabled: true, providers: [], channels: [], plans: [], payment_methods: [] }
          else if (path === '/admin/proxies' || path === '/admin/backups') data = paginate([], query)
          else if (path === '/model-plaza') data = { description: '', groups: groups.map((group, i) => ({ ...group, models: [{ name: modelNames[i % modelNames.length], platform: group.platform, pricing: { billing_mode: 'token', input_price: 3e-6, output_price: 15e-6, cache_write_price: 3.75e-6, cache_read_price: .3e-6, image_input_price: null, image_output_price: null, per_request_price: null, intervals: [] }, official_pricing: { input_price: 3e-6, output_price: 15e-6, cache_write_price: 3.75e-6, cache_read_price: .3e-6 } }] })) }
          else if (/^\/(keys|admin\/users|admin\/groups)(\/\d+)?$/.test(path)) {
            const collection = path.startsWith('/keys') ? keys : path.startsWith('/admin/users') ? users : groups
            const id = Number(path.match(/\/(\d+)$/)?.[1])
            if (method === 'POST') { const item: RecordData = { ...structuredClone(collection[0]), ...payload, id: Math.max(0, ...collection.map(row => row.id)) + 1, created_at: new Date().toISOString() }; if (path === '/keys') item.key = `sk-demo-local-only-${item.id}`; collection.push(item); data = item }
            else if (method === 'PUT' && id) { const item = collection.find(row => row.id === id); if (item) Object.assign(item, payload); data = item }
            else if (method === 'DELETE' && id) { const index = collection.findIndex(row => row.id === id); if (index >= 0) collection.splice(index, 1); data = { message: '已删除演示记录' } }
            else if (id) data = collection.find(row => row.id === id)
            else { const search = (query.get('search') || '').toLowerCase(); data = paginate(collection.filter(item => (!search || `${item.name || item.username} ${item.email || ''}`.toLowerCase().includes(search)) && (!query.get('status') || item.status === query.get('status')) && (!query.get('platform') || item.platform === query.get('platform')) && (!query.get('group_id') || String(item.group_id) === query.get('group_id'))), query) }
          }
          else { json(response, `本地预览尚未模拟此接口：${method} ${path}`, 501); return }
          json(response, data ?? null)
        } catch (error) {
          json(response, `模拟数据请求失败：${error instanceof Error ? error.message : String(error)}`, 400)
        }
      })
    }
  }
}
