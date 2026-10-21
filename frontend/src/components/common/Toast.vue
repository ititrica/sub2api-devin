<template>
  <Teleport to="body">
    <div
      class="site-toast-stack pointer-events-none fixed right-4 top-4 z-[9999] space-y-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'site-toast pointer-events-auto overflow-hidden',
            'bg-white dark:bg-dark-800',
            'border-l-4',
            getBorderColor(toast.type)
          ]"
        >
          <div class="p-4">
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div class="site-toast-flag mt-0.5 flex-shrink-0">
                <Icon
                  :name="getToastIconName(toast.type)"
                  size="md"
                  :class="getIconColor(toast.type)"
                  aria-hidden="true"
                />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <p v-if="toast.title" class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ toast.title }}
                </p>
                <p
                  :class="[
                    'text-sm leading-relaxed',
                    toast.title
                      ? 'mt-1 text-gray-600 dark:text-gray-300'
                      : 'text-gray-900 dark:text-white'
                  ]"
                >
                  {{ toast.message }}
                </p>
              </div>

              <!-- Close button -->
              <button
                @click="removeToast(toast.id)"
                class="-m-1 flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-dark-700 dark:hover:text-gray-300"
                aria-label="Close notification"
              >
                <Icon name="x" size="sm" />
              </button>
            </div>
          </div>

          <!-- Progress bar -->
          <div v-if="toast.duration" class="h-1 bg-gray-100 dark:bg-dark-700">
            <div
              :class="['h-full toast-progress', getProgressBarColor(toast.type)]"
              :style="{ animationDuration: `${toast.duration}ms` }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { completeOperation } from '@/utils/operationFeedback'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const toasts = computed(() => appStore.toasts)
watch(() => toasts.value.filter(toast => toast.type === 'success').map(toast => toast.id), (ids, previous) => {
  if (ids.some(id => !previous.includes(id))) completeOperation()
})

const getToastIconName = (type: string): 'checkCircle' | 'xCircle' | 'exclamationTriangle' | 'infoCircle' => {
  switch (type) {
    case 'success':
      return 'checkCircle'
    case 'error':
      return 'xCircle'
    case 'warning':
      return 'exclamationTriangle'
    case 'info':
    default:
      return 'infoCircle'
  }
}

const getIconColor = (_type: string): string => 'text-current'
const getBorderColor = (_type: string): string => 'site-toast-border'
const getProgressBarColor = (_type: string): string => 'site-toast-progress'

const removeToast = (id: string) => {
  appStore.hideToast(id)
}
</script>

<style scoped>
.site-toast-stack { width: min(420px, calc(100vw - 32px)); }
.site-toast { width: 100%; border: 1px solid var(--ef-rule); border-top: 3px solid var(--ef-ink); }
.site-toast-flag { padding: 4px; background: var(--ef-signal); color: var(--ef-on-signal); }
.site-toast-progress { background: var(--ef-ink); }

.toast-progress {
  width: 100%;
  animation-name: toast-progress-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  transform-origin: left;
}

@keyframes toast-progress-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
