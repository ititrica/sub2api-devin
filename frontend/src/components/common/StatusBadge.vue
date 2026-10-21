<template>
  <Transition name="status" mode="out-in"><span :key="status" class="status-badge" :class="`status-${variant}`">
    <span class="status-mark" aria-hidden="true"></span>
    {{ label }}
  </span></Transition>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ status: string; label: string }>()
const variant = computed(() => {
  if (['active', 'success'].includes(props.status)) return 'active'
  if (['error', 'danger', 'warning'].includes(props.status)) return 'attention'
  return 'inactive'
})
</script>
<style scoped>
.status-badge { display: inline-flex; align-items: center; gap: 7px; padding: 3px 8px; border: 1px solid var(--ef-rule); font-size: 12px; color: var(--ef-ink); }
.status-mark { width: 5px; height: 5px; background: currentColor; }
.status-active { border-color: var(--ef-ink); }
.status-inactive { border-style: dashed; color: var(--ef-ink-2); }
.status-inactive .status-mark { background: transparent; border: 1px solid currentColor; }
.status-attention { border-color: transparent; background: var(--ef-signal); color: var(--ef-on-signal); }
</style>
