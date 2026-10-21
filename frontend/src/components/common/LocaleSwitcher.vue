<template>
  <div ref="dropdownRef" class="locale-switcher" @keydown.esc.stop="closeDropdown">
    <button
      ref="triggerRef"
      type="button"
      class="locale-trigger"
      :disabled="switching"
      :title="currentLocale?.name"
      :aria-label="`Language / ${currentLocale?.name || currentLocaleCode}`"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      @click="toggleDropdown"
      @keydown.down.prevent="openAndFocus"
    >
      <svg class="locale-symbol" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2.5 3.5h11v11h-11zM10.5 10.5h11v11h-11z" stroke="currentColor" stroke-width="1.25" />
        <path d="M5 7h6M8 5.5V7m-2 0c.5 2.5 2.3 4.3 4.5 5M10 7c-.5 2.5-2.3 4.3-4.5 5M13 18.5l3-6 3 6m-4.8-2h3.6" stroke="currentColor" stroke-width="1.25" stroke-linecap="square" stroke-linejoin="miter" />
      </svg>
      <span class="locale-current">{{ currentLocaleCode.toUpperCase() }}</span>
      <Icon name="chevronDown" size="xs" :class="{ 'rotate-180': isOpen }" />
    </button>
    <Transition name="locale-menu">
      <div v-if="isOpen" class="locale-menu" role="menu" aria-label="Language" @keydown.down.prevent="moveFocus(1)" @keydown.up.prevent="moveFocus(-1)">
        <p class="locale-menu-label" aria-hidden="true">// LANGUAGE</p>
        <button
          v-for="item in availableLocales"
          :key="item.code"
          type="button"
          role="menuitemradio"
          :aria-checked="item.code === currentLocaleCode"
          :disabled="switching"
          :class="['locale-option', { 'is-current': item.code === currentLocaleCode }]"
          @click="selectLocale(item.code)"
        >
          <span class="locale-code" aria-hidden="true">{{ item.code.toUpperCase() }}</span>
          <span :lang="item.code">{{ item.name }}</span>
          <Icon v-if="item.code === currentLocaleCode" name="check" size="sm" class="ml-auto" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { setLocale, availableLocales } from '@/i18n'

const { locale } = useI18n()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const switching = ref(false)
const currentLocaleCode = computed(() => locale.value)
const currentLocale = computed(() => availableLocales.find(item => item.code === locale.value))
function toggleDropdown() { isOpen.value = !isOpen.value }
function closeDropdown() { isOpen.value = false; triggerRef.value?.focus() }
async function openAndFocus() {
  isOpen.value = true
  await nextTick()
  dropdownRef.value?.querySelector<HTMLButtonElement>('[role="menuitemradio"]')?.focus()
}
function moveFocus(direction: number) {
  const options = Array.from(dropdownRef.value?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') || [])
  const current = options.indexOf(document.activeElement as HTMLButtonElement)
  options[(current + direction + options.length) % options.length]?.focus()
}
async function selectLocale(code: string) {
  if (switching.value || code === currentLocaleCode.value) { isOpen.value = false; return }
  switching.value = true
  try {
    await setLocale(code)
    isOpen.value = false
    window.location.reload()
  } finally { switching.value = false }
}
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) isOpen.value = false
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.locale-switcher { position: relative; color: inherit; }
.locale-trigger { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 10px; font: 600 11px var(--ef-font-ui); letter-spacing: .08em; color: inherit; }
.locale-trigger:hover { background: color-mix(in srgb, currentColor 9%, transparent); }
.locale-symbol { width: 23px; height: 23px; flex: 0 0 23px; }
.locale-trigger > :last-child { opacity: .6; }
.locale-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 80; width: 188px; padding: 6px; border: 1px solid var(--ef-ink); background: var(--ef-panel); color: var(--ef-ink); }
.locale-menu-label { margin: 6px 8px 10px; font: 600 9px var(--ef-font-ui); letter-spacing: .14em; color: var(--ef-ink-2); }
.locale-option { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 44px; padding: 9px 10px; font-size: 13px; text-align: left; }
.locale-option:hover { background: var(--ef-chip); }
.locale-option.is-current { background: var(--ef-signal); color: var(--ef-on-signal); clip-path: var(--ef-clip); }
.locale-code { font: 600 10px var(--ef-font-ui); letter-spacing: .08em; opacity: .65; }
.locale-menu-enter-active { transition: opacity 200ms var(--ef-snap), transform 200ms var(--ef-snap); }
.locale-menu-leave-active { transition: opacity 140ms var(--ef-mech), transform 140ms var(--ef-mech); }
.locale-menu-enter-from, .locale-menu-leave-to { opacity: 0; transform: translateY(-6px); }
@media (max-width: 600px) { .locale-current { display: none; } .locale-trigger { padding-inline: 6px; gap: 4px; } }
</style>
