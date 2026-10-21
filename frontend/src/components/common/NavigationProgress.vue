<script setup lang="ts">
/**
 * 导航进度条组件
 * 在页面顶部显示加载进度，提供导航反馈
 */
import { computed } from 'vue'
import { useNavigationLoadingState } from '@/composables/useNavigationLoading'

const { isLoading } = useNavigationLoadingState()

// 进度条可见性
const isVisible = computed(() => isLoading.value)
</script>

<template>
  <Transition name="progress-fade">
    <div
      v-show="isVisible"
      class="navigation-progress"
      role="progressbar"
      aria-label="Loading"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="navigation-progress-bar" />
    </div>
  </Transition>
</template>

<style scoped>
.navigation-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 9999; overflow: hidden; background: transparent; }
.navigation-progress-bar { height: 100%; width: 35%; background: var(--ef-ink); animation: progress-slide 1500ms var(--ef-mech) infinite; }
@keyframes progress-slide { from { transform: translateX(-100%); } to { transform: translateX(386%); } }
.progress-fade-enter-active { transition: opacity 200ms var(--ef-snap); }
.progress-fade-leave-active { transition: opacity 160ms var(--ef-mech); }
.progress-fade-enter-from, .progress-fade-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .navigation-progress-bar { animation: none; width: 100%; background-image: var(--ef-hatch); } }
</style>
