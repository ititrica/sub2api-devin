<template>
  <div class="table-page-layout" :class="{ 'mobile-mode': isMobile }">
    <!-- 固定区域：操作按钮 -->
    <div v-if="$slots.actions" class="layout-section-fixed">
      <slot name="actions" />
    </div>

    <!-- 固定区域：搜索和过滤器 -->
    <div v-if="$slots.filters" class="layout-section-fixed">
      <slot name="filters" />
    </div>

    <!-- 滚动区域：表格 -->
    <div class="layout-section-scrollable">
      <div class="card table-scroll-container">
        <slot name="table" />
      </div>
    </div>

    <!-- 固定区域：分页器 -->
    <div v-if="$slots.pagination" class="layout-section-fixed">
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.table-page-layout { display: flex; flex-direction: column; gap: 18px; min-width: 0; min-height: 380px; height: calc(100dvh - 252px); }
.layout-section-fixed { flex-shrink: 0; min-width: 0; }
.layout-section-fixed:has(+ .layout-section-scrollable) { padding-bottom: 18px; border-bottom: 1px solid var(--ef-rule); }
.layout-section-scrollable { display: flex; flex: 1; flex-direction: column; min-height: 0; min-width: 0; }
.table-scroll-container { display: flex; flex-direction: column; height: 100%; min-width: 0; overflow: hidden; background: var(--ef-panel); border: 0; border-top: 2px solid var(--ef-ink); border-bottom: 1px solid var(--ef-rule); box-shadow: none; border-radius: 0; }
.table-scroll-container :deep(.table-wrapper) { @apply overflow-x-auto; flex: 1; overflow-y: auto; scrollbar-gutter: stable; }
.table-scroll-container :deep(table) { width: 100%; min-width: max-content; display: table; }
.table-scroll-container :deep(thead) { background: var(--ef-paper); }
.table-scroll-container :deep(th) { padding: 15px 18px; color: var(--ef-ink-2); border-bottom: 1px solid var(--ef-rule); font-size: 11px; font-weight: 650; text-align: left; }
.table-scroll-container :deep(td) { padding: 16px 18px; color: var(--ef-ink); border-bottom: 1px solid var(--ef-rule); font-size: 12px; }
.table-page-layout.mobile-mode { height: auto; min-height: 0; }
.table-page-layout.mobile-mode .table-scroll-container { height: auto; min-width: 0; }
.table-page-layout.mobile-mode .layout-section-scrollable { flex: none; min-height: 0; }
.table-page-layout.mobile-mode .table-scroll-container :deep(.table-wrapper) { width: 100%; max-width: 100%; }
.table-page-layout.mobile-mode .table-scroll-container :deep(table) { display: table; min-width: 100%; }
@media (max-width: 639px) { .table-page-layout { gap: 14px; } .layout-section-fixed :deep(.justify-end) { flex-wrap: wrap; } }
</style>
