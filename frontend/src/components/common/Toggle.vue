<template>
  <button type="button" class="site-toggle" :class="{ 'is-on': modelValue }" :disabled="disabled" role="switch" :aria-checked="modelValue" @click="toggle">
    <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
  </button>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: boolean; disabled?: boolean }>(), { disabled: false })
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
function toggle() { if (!props.disabled) emit('update:modelValue', !props.modelValue) }
</script>
<style scoped>
.site-toggle { display:inline-flex; align-items:center; width:48px; height:44px; flex-shrink:0; background:transparent; }
.toggle-track { display:block; position:relative; width:44px; height:24px; background:var(--ef-chip); border:1px solid var(--ef-rule); transition:background 200ms var(--ef-mech); }
.toggle-thumb { position:absolute; top:3px; left:3px; width:16px; height:16px; background:var(--ef-ink-2); transition:transform 200ms var(--ef-mech); }
.is-on .toggle-track { background:var(--ef-signal); border-color:transparent; }
.is-on .toggle-thumb { transform:translateX(20px); background:var(--ef-on-signal); }
.site-toggle:disabled { cursor:not-allowed; opacity:.45; }
</style>
