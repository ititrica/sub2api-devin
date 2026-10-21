<template>
  <section class="quick-actions">
    <header>
      <p class="ef-eyebrow">// QUICK ACTIONS</p>
      <h2>{{ t('dashboard.quickActions') }}</h2>
    </header>
    <button @click="router.push('/keys')" class="quick-action">
      <Icon name="key" size="md" /><span
        ><strong>{{ t('dashboard.createApiKey') }}</strong
        ><small>{{ t('dashboard.generateNewKey') }}</small></span
      ><Icon name="arrowRight" size="sm" />
    </button>
    <button @click="router.push('/usage')" class="quick-action">
      <Icon name="chart" size="md" /><span
        ><strong>{{ t('dashboard.viewUsage') }}</strong
        ><small>{{ t('dashboard.checkDetailedLogs') }}</small></span
      ><Icon name="arrowRight" size="sm" />
    </button>
    <button v-if="canUseBatchImage" @click="router.push('/batch-image')" class="quick-action">
      <Icon name="sparkles" size="md" /><span
        ><strong>{{ t('dashboard.batchImageAgent') }}</strong
        ><small>{{ t('dashboard.batchImageAgentDesc') }}</small></span
      ><Icon name="arrowRight" size="sm" />
    </button>
    <button @click="router.push('/redeem')" class="quick-action">
      <Icon name="gift" size="md" /><span
        ><strong>{{ t('dashboard.redeemCode') }}</strong
        ><small>{{ t('dashboard.addBalanceWithCode') }}</small></span
      ><Icon name="arrowRight" size="sm" />
    </button>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'
const router = useRouter()
const { t } = useI18n()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()

onMounted(() => {
  void refreshBatchImageAccess()
})
</script>

<style scoped>
.quick-actions {
  border-top: 2px solid var(--ef-ink);
}
header {
  padding: 22px 0;
}
h2 {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
}
.quick-action {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 78px;
  padding: 14px calc(14px + var(--ef-cut)) 14px 14px;
  margin-bottom: 8px;
  color: var(--ef-ink);
  background: var(--ef-panel);
  text-align: left;
  clip-path: polygon(
    0 0,
    100% 0,
    100% calc(100% - var(--ef-cut)),
    calc(100% - var(--ef-cut)) 100%,
    0 100%
  );
  transition: background 180ms var(--ef-mech);
}
.quick-action > span {
  flex: 1;
  min-width: 0;
}
strong,
small {
  display: block;
}
strong {
  font-size: 13px;
  font-weight: 600;
}
small {
  margin-top: 4px;
  font-size: 11px;
  color: var(--ef-ink-2);
}
.quick-action:hover,
.quick-action:active {
  background: var(--ef-signal);
  color: var(--ef-on-signal);
}
.quick-action:hover small,
.quick-action:active small {
  color: var(--ef-on-signal);
}
.quick-action:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -4px;
}
</style>
