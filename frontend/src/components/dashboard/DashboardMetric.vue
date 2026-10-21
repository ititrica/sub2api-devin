<template>
  <article class="dashboard-metric" :class="{ 'dashboard-metric--lead': prominent }">
    <div class="metric-label">
      <span class="ef-eyebrow">// {{ eyebrow }}</span
      ><span>{{ label }}</span>
    </div>
    <div class="metric-value">
      <slot name="value"><SettledText :value="value ?? '—'" /></slot>
    </div>
    <div class="metric-detail"><slot /></div>
  </article>
</template>

<script setup lang="ts">
import SettledText from "@/components/common/SettledText.vue"
defineProps<{ eyebrow: string; label: string; value?: string | number; prominent?: boolean }>()
</script>

<style scoped>
.dashboard-metric { min-width:0; padding:22px 24px; border-right:1px solid var(--ef-rule); border-bottom:1px solid var(--ef-rule); display:flex; flex-direction:column; }
.metric-label { display:grid; gap:6px; font-size:12px; font-weight:600; }
.ef-eyebrow { color:var(--ef-ink-2); font-size:9px; }
.metric-value { margin:18px 0 10px; font:600 clamp(28px,2.6vw,40px)/1.1 var(--ef-font-ui); font-stretch:112%; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
.metric-detail { margin-top:auto; font-size:11px; line-height:1.8; color:var(--ef-ink-2); }
.metric-detail :deep(mark) { padding:2px 6px; background:var(--ef-signal); color:var(--ef-on-signal); }
.dashboard-metric--lead { background:var(--ef-chip); }
.dashboard-metric--lead .metric-value { font-weight:700; }
@media(max-width:700px) { .dashboard-metric { padding:18px 16px; } .metric-value { font-size:clamp(21px,6vw,28px); white-space:nowrap; } }
</style>
