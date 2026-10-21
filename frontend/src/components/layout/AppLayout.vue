<template>
  <div class="app-layout" :class="{ 'app-layout-collapsed': sidebarCollapsed }">
    <AppSidebar />
    <div class="app-workspace">
      <AppHeader />
      <main id="main-content" class="app-content">
        <LayoutPageHeading />
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/styles/onboarding.css'
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useOnboardingStore } from '@/stores/onboarding'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import LayoutPageHeading from './LayoutPageHeading.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const { replayTour } = useOnboardingTour({
  storageKey: isAdmin.value ? 'admin_guide' : 'user_guide',
  autoStart: true
})

const onboardingStore = useOnboardingStore()

onMounted(() => {
  onboardingStore.setReplayCallback(replayTour)
})

defineExpose({ replayTour })
</script>

<style scoped>
.app-layout { min-height: 100dvh; background: var(--ef-paper); color: var(--ef-ink); }
.app-workspace { min-width: 0; margin-left: 248px; min-height: 100dvh; transition: margin-left 280ms var(--ef-ease-mech); }
.app-layout-collapsed .app-workspace { margin-left: 76px; }
.app-content { width: 100%; min-width: 0; padding: 30px 32px 32px; max-width: 1920px; margin-inline: auto; }
@media (max-width: 1279px) { .app-content { padding: 24px; } }
@media (max-width: 1023px) { .app-workspace, .app-layout-collapsed .app-workspace { margin-left: 0; } }
@media (max-width: 639px) { .app-content { padding: 24px 16px; } }
@media (prefers-reduced-motion: reduce) { .app-workspace { transition: none; } }
</style>
