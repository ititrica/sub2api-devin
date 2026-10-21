import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/** Canvas colours follow the same live CSS tokens as the rest of the application. */
export function useChartTheme() {
  const revision = ref(0)
  let observer: MutationObserver | undefined
  onMounted(() => {
    observer = new MutationObserver(() => {
      revision.value++
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })
  })
  onBeforeUnmount(() => observer?.disconnect())
  return computed(() => {
    void revision.value
    const dark = document.documentElement.classList.contains('dark')
    const style = getComputedStyle(document.documentElement)
    const token = (name: string, fallback: string) =>
      style.getPropertyValue(name).trim() || fallback
    const palette = dark
      ? ['#e9e6df', '#bcb7ac', '#918c83', '#716e66', '#c9c4b8', '#aaa59b']
      : ['#292824', '#5f5c54', '#928d80', '#b6b0a2', '#76736b', '#cbc5b8']
    return {
      text: token('--ef-ink-2', dark ? '#aaa59b' : '#5f5c54'),
      grid: token('--ef-rule', dark ? '#3e3c36' : '#ddd8cd'),
      ink: token('--ef-ink', dark ? '#e9e6df' : '#161616'),
      panel: token('--ef-panel', dark ? '#24231f' : '#fffdf7'),
      signal: token('--ef-signal', '#ffb31f'),
      palette,
      series: (index: number) => palette[index % palette.length],
      // No canvas animation: this also respects changes to reduced-motion preferences.
      animation: false as const,
      tooltip: {
        cornerRadius: 0,
        padding: 12,
        titleFont: { family: 'Saira, sans-serif' },
        bodyFont: { family: 'Saira, sans-serif' }
      }
    }
  })
}
