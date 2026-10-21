<template>
  <span class="settled-text" @pointerenter="play(360)" @focusin="play(360)">
    <span class="sr-only">{{ value }}</span><span aria-hidden="true">{{ display }}</span>
  </span>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { reducedMotion } from '@/utils/motion'
const props = defineProps<{ value: string | number }>()
const display = ref(String(props.value))
let frame = 0
let media: MediaQueryList | undefined
function stop() { cancelAnimationFrame(frame); display.value = String(props.value) }
function play(duration = 600) {
  stop()
  if (reducedMotion() || document.documentElement.classList.contains('ef-routing')) return
  const text = String(props.value)
  // Only numeric / Latin readouts settle. Chinese labels and punctuation stay stable.
  if (!/[A-Za-z0-9]/.test(text)) return
  const start = performance.now()
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration)
    display.value = [...text].map((character, index) =>
      index / text.length <= progress || !/[A-Za-z0-9]/.test(character)
        ? character : '0123456789'[Math.floor(Math.random() * 10)]
    ).join('')
    if (progress < 1) frame = requestAnimationFrame(tick)
    else display.value = text
  }
  frame = requestAnimationFrame(tick)
}
watch(() => props.value, () => play(360))
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', stop)
  play()
})
onBeforeUnmount(() => { stop(); media?.removeEventListener('change', stop) })
</script>
<style scoped>
.settled-text { font-variant-numeric: tabular-nums; }
</style>
