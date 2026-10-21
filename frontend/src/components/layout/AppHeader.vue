<template>
  <header class="app-command-bar">
    <div class="command-context">
      <button class="command-button mobile-menu-button" :aria-label="t('common.toggleMenu')" :aria-expanded="appStore.mobileOpen" aria-controls="app-sidebar" @click="toggleMobileSidebar"><Icon name="menu" size="md" /></button>
      <router-link :to="authStore.isAdmin ? '/admin/dashboard' : '/dashboard'" class="command-workspace">{{ authStore.isAdmin ? 'ADMIN' : 'WORKSPACE' }}</router-link>
      <span class="command-divider" aria-hidden="true">/</span>
      <span class="command-page">{{ pageTitle }}</span>
    </div>
    <div class="command-tools">
      <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="command-button command-docs"><Icon name="book" size="sm" /><span>{{ t('nav.docs') }}</span></a>
      <router-link v-if="user && modelPlazaEnabled" :to="{ path: '/model-plaza', query: { embedded: '1' } }" class="command-button" :title="t('nav.modelPlaza')" :aria-label="t('nav.modelPlaza')"><Icon name="grid" size="sm" /><span class="command-tool-label">{{ t('nav.modelPlaza') }}</span></router-link>
      <div class="command-widget"><AnnouncementBell v-if="user" /></div>
      <div class="command-widget command-locale"><LocaleSwitcher /></div>
      <div v-if="user && subscriptionFeatureEnabled" class="command-widget command-subscriptions"><SubscriptionProgressMini /></div>
      <div v-if="user" class="command-balance" :title="`${balanceAvailableText} ${formatHeaderMoney(availableBalance)} / ${balanceFrozenLabel}`">
        <span>{{ t('common.balance') }}</span><strong>{{ formatHeaderMoney(availableBalance) }}</strong>
        <small v-if="frozenBalance > 0">{{ balanceFrozenLabel }}</small>
      </div>
      <div v-if="user" ref="dropdownRef" class="user-menu">
        <button class="user-trigger" :aria-label="t('common.userMenu')" :aria-expanded="dropdownOpen" aria-controls="header-user-menu" @click="toggleDropdown">
          <span class="user-avatar"><img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" /><span v-else>{{ userInitials }}</span></span>
          <span class="user-identity"><strong>{{ displayName }}</strong><small>{{ t('admin.users.roles.' + user.role) }}</small></span>
          <Icon name="chevronDown" size="sm" class="user-chevron" />
        </button>
        <transition name="dropdown">
          <div v-if="dropdownOpen" id="header-user-menu" class="user-dropdown">
            <div class="user-dropdown-identity"><strong>{{ displayName }}</strong><span>{{ user.email }}</span></div>
            <dl class="user-balance-details">
              <div><dt>{{ balanceAvailableText }}</dt><dd>{{ formatHeaderMoney(availableBalance) }}</dd></div>
              <div v-if="frozenBalance > 0"><dt>{{ balanceFrozenText }}</dt><dd>{{ formatHeaderMoney(frozenBalance) }}</dd></div>
              <div><dt>{{ balanceTotalText }}</dt><dd>{{ formatHeaderMoney(totalBalance) }}</dd></div>
            </dl>
            <div class="user-dropdown-section">
              <router-link to="/profile" class="user-dropdown-item" @click="closeDropdown"><Icon name="user" size="sm" />{{ t('nav.profile') }}<span>↗</span></router-link>
              <router-link to="/keys" class="user-dropdown-item" @click="closeDropdown"><Icon name="key" size="sm" />{{ t('nav.apiKeys') }}<span>↗</span></router-link>
              <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="user-dropdown-item" @click="closeDropdown"><Icon name="book" size="sm" />{{ t('nav.docs') }}<span>↗</span></a>
              <a v-if="authStore.isAdmin" href="https://github.com/Wei-Shaw/sub2api" target="_blank" rel="noopener noreferrer" class="user-dropdown-item" @click="closeDropdown"><Icon name="externalLink" size="sm" />{{ t('nav.github') }}<span>↗</span></a>
            </div>
            <div v-if="contactInfo" class="user-support"><span>{{ t('common.contactSupport') }}</span><strong>{{ contactInfo }}</strong></div>
            <div v-if="showOnboardingButton" class="user-dropdown-section"><button class="user-dropdown-item" @click="handleReplayGuide"><Icon name="book" size="sm" />{{ t('onboarding.restartTour') }}</button></div>
            <div class="user-dropdown-section"><button class="user-dropdown-item" @click="handleLogout"><Icon name="arrowRight" size="sm" />{{ t('nav.logout') }}</button></div>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore, useAuthStore, useOnboardingStore } from '@/stores'
import { useAdminSettingsStore } from '@/stores/adminSettings'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import SubscriptionProgressMini from '@/components/common/SubscriptionProgressMini.vue'
import AnnouncementBell from '@/components/common/AnnouncementBell.vue'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'
import { resolveRouteMetaKeys } from '@/router/title'
import { resolveSiteBillingMode } from '@/utils/siteBillingMode'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const adminSettingsStore = useAdminSettingsStore()
const onboardingStore = useOnboardingStore()

const user = computed(() => authStore.user)
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const contactInfo = computed(() => appStore.contactInfo)
const docUrl = computed(() => sanitizeUrl(appStore.docUrl))
const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))
const avatarUrl = computed(() => user.value?.avatar_url?.trim() || '')
const availableBalance = computed(() => Number(user.value?.balance || 0))
const frozenBalance = computed(() => Number(user.value?.frozen_balance || 0))
const totalBalance = computed(() => availableBalance.value + frozenBalance.value)
const balanceAvailableText = computed(() => t('common.availableBalance') === 'common.availableBalance' ? '可用余额' : t('common.availableBalance'))
const balanceFrozenText = computed(() => t('common.frozenBalance') === 'common.frozenBalance' ? '冻结金额' : t('common.frozenBalance'))
const balanceTotalText = computed(() => t('common.totalBalance') === 'common.totalBalance' ? '总余额' : t('common.totalBalance'))
const balanceFrozenLabel = computed(() => `${balanceFrozenText.value} ${formatHeaderMoney(frozenBalance.value)}`)

// 只在标准模式的管理员下显示新手引导按钮
const showOnboardingButton = computed(() => {
  return !authStore.isSimpleMode && user.value?.role === 'admin'
})

const userInitials = computed(() => {
  if (!user.value) return ''
  // Prefer username, fallback to email
  if (user.value.username) {
    return user.value.username.substring(0, 2).toUpperCase()
  }
  if (user.value.email) {
    // Get the part before @ and take first 2 chars
    const localPart = user.value.email.split('@')[0]
    return localPart.substring(0, 2).toUpperCase()
  }
  return ''
})

const displayName = computed(() => {
  if (!user.value) return ''
  return user.value.username || user.value.email?.split('@')[0] || ''
})

// 订阅功能关闭时不挂载顶栏订阅徽章（组件 onMounted 会拉取订阅接口）。
const subscriptionFeatureEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.subscription))

// /purchase 的标题/描述随站点计费模式切换，与 document.title 共用同一解析。
const routeMetaKeys = computed(() => resolveRouteMetaKeys(route, {
  billingMode: resolveSiteBillingMode(appStore.cachedPublicSettings),
}))

const pageTitle = computed(() => {
  // For custom pages, use the menu item's label instead of generic "自定义页面"
  if (route.name === 'CustomPage') {
    const id = route.params.id as string
    const publicItems = appStore.cachedPublicSettings?.custom_menu_items ?? []
    const menuItem = publicItems.find((item) => item.id === id)
      ?? (authStore.isAdmin ? adminSettingsStore.customMenuItems.find((item) => item.id === id) : undefined)
    if (menuItem?.label) return menuItem.label
  }
  const titleKey = routeMetaKeys.value.titleKey
  if (titleKey) {
    return t(titleKey)
  }
  return (route.meta.title as string) || ''
})


function toggleMobileSidebar() {
  appStore.toggleMobileSidebar()
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    void nextTick(() => dropdownRef.value?.querySelector<HTMLElement>('.user-dropdown a, .user-dropdown button')?.focus())
  }
}

function onHeaderKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && dropdownOpen.value) {
    closeDropdown()
    dropdownRef.value?.querySelector<HTMLElement>('.user-trigger')?.focus()
  }
}

watch(() => route.fullPath, closeDropdown)


function closeDropdown() {
  dropdownOpen.value = false
}

async function handleLogout() {
  closeDropdown()
  try {
    await authStore.logout()
  } catch (error) {
    // Ignore logout errors - still redirect to login
    console.error('Logout error:', error)
  }
  await router.push('/login')
}

function handleReplayGuide() {
  closeDropdown()
  onboardingStore.replay()
}

function formatHeaderMoney(value: number) {
  if (!Number.isFinite(value)) return '$0.00'
  return `$${value.toFixed(2)}`
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', onHeaderKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', onHeaderKeydown)
})
</script>

<style scoped>
.app-command-bar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 18px; height: 64px; padding: 0 28px; background: #191918; color: #f3f1e9; border-bottom: 1px solid #3a3935; }
.command-context { display: flex; align-items: center; gap: 14px; min-width: 0; }
.command-workspace { flex-shrink: 0; background: var(--ef-signal); color: var(--ef-on-signal); font: 650 9px var(--ef-font-ui); font-stretch: 125%; letter-spacing: .12em; padding: 4px 9px; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%); }
.command-divider { color: #75746e; font-weight: 300; }
.command-page { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 500; }
.command-tools { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.command-button { min-width: 38px; min-height: 40px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; color: #d8d6cf; font-size: 11px; transition: background 160ms var(--ef-ease-mech); }
.command-button:hover, .user-trigger:hover { background: #36352f; color: #fff; }
.command-widget { min-width: 0; }
.command-widget :deep(> div > button) { min-height: 40px; color: #d8d6cf; background: transparent; }
.command-widget :deep(> div > button:hover) { background: #36352f; }
.command-widget :deep(> div > button svg), .command-widget :deep(> div > button span) { color: inherit; }
.command-widget :deep(> div > .absolute) { max-width: calc(100vw - 32px); }
.command-widget :deep(.animate-ping) { animation: none; }
.command-widget :deep(.bg-red-500) { background: var(--ef-signal); }
.command-balance { display: grid; gap: 0; padding: 0 14px; margin: 0 2px; border-left: 1px solid #44433c; border-right: 1px solid #44433c; }
.command-balance > span { font-size: 9px; color: #aaa89f; }
.command-balance strong { font: 600 16px var(--ef-font-ui); font-stretch: 112%; font-variant-numeric: tabular-nums; line-height: 1.2; }
.command-balance small { font-size: 8px; color: #c9c7bf; }
.user-menu { position: relative; }
.user-trigger { display: flex; align-items: center; gap: 9px; padding: 4px 5px; min-height: 44px; color: inherit; }
.user-avatar { display: flex; justify-content: center; align-items: center; width: 32px; height: 32px; flex: 0 0 32px; background: #e7e3d7; color: #24241e; font: 650 12px var(--ef-font-ui); overflow: hidden; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-identity { display: grid; text-align: left; }
.user-identity strong { max-width: 100px; overflow: hidden; text-overflow: ellipsis; font-size: 11px; font-weight: 600; }
.user-identity small { color: #aaa89f; font-size: 9px; }
.user-chevron { color: #aaa89f; }
.user-dropdown { position: absolute; right: 0; top: calc(100% + 12px); width: 276px; max-width: calc(100vw - 24px); max-height: calc(100dvh - 80px); overflow-y: auto; background: var(--ef-panel); color: var(--ef-ink); border: 1px solid var(--ef-rule); border-top: 3px solid var(--ef-ink); }
.user-dropdown-identity { display: grid; gap: 3px; padding: 18px; overflow-wrap: anywhere; }
.user-dropdown-identity strong { font-size: 15px; }
.user-dropdown-identity span { font-size: 11px; color: var(--ef-ink-2); }
.user-balance-details { background: var(--ef-paper); padding: 12px 18px; border-block: 1px solid var(--ef-rule); }
.user-balance-details > div { display: flex; justify-content: space-between; gap: 10px; padding-block: 3px; font-size: 11px; }
.user-balance-details dt { color: var(--ef-ink-2); }
.user-balance-details dd { font-family: var(--ef-font-ui); font-variant-numeric: tabular-nums; font-weight: 600; }
.user-dropdown-section { padding: 5px; border-top: 1px solid var(--ef-rule); }
.user-dropdown-item { display: flex; align-items: center; width: 100%; min-height: 44px; gap: 10px; padding: 9px 13px; font-size: 12px; text-align: left; }
.user-dropdown-item span:last-child { margin-left: auto; }
.user-dropdown-item:hover { background: var(--ef-chip); }
.user-support { display: grid; gap: 4px; padding: 12px 18px; border-top: 1px solid var(--ef-rule); overflow-wrap: anywhere; }
.user-support span { color: var(--ef-ink-2); font-size: 10px; }
.user-support strong { font-size: 12px; font-weight: 500; }
.app-command-bar :is(button, a):focus-visible { outline: 2px solid currentColor; outline-offset: -3px; }
.mobile-menu-button { display: none; }
.dropdown-enter-active { transition: opacity 220ms var(--ef-ease-snap), transform 220ms var(--ef-ease-snap); }
.dropdown-leave-active { transition: opacity 150ms var(--ef-ease-mech), transform 150ms var(--ef-ease-mech); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px); }
@media (max-width: 1279px) { .user-identity, .user-chevron, .command-tool-label, .command-docs { display: none; } .app-command-bar { padding-inline: 20px; } }
@media (max-width: 1023px) { .mobile-menu-button { display: flex; } .app-command-bar { padding-inline: 12px; gap: 10px; } .command-context { gap: 10px; } }
@media (max-width: 639px) { .app-command-bar { gap: 4px; padding-inline: 8px; } .command-tools { gap: 0; } .command-workspace, .command-divider, .command-balance { display: none; } .command-context { gap: 6px; } .command-page { max-width: 88px; font-size: 11px; } .command-button { min-width: 36px; padding-inline: 6px; } .command-widget :deep(> div > button) { padding-inline: 6px; } .user-trigger { gap: 0; padding-inline: 4px; } .user-avatar { width: 30px; height: 30px; flex-basis: 30px; } }
@media (max-width: 639px) { .command-subscriptions :deep(> div > .absolute) { position: fixed; right: 12px; top: 66px; margin-top: 0; } }
@media (prefers-reduced-motion: reduce) { .app-command-bar *, .dropdown-enter-active, .dropdown-leave-active { transition: none; } }
</style>
