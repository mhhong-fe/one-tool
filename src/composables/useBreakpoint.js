import { ref, computed, onMounted, onUnmounted } from 'vue'

/* sm <768 H5 | md 768-1000 平板 | lg ≥1000 PC */
const WIDTH = { sm: 768, md: 1000 }

function getBreakpoint() {
  if (typeof window === 'undefined') return 'lg'
  const w = window.innerWidth
  if (w < WIDTH.sm) return 'sm'
  if (w < WIDTH.md) return 'md'
  return 'lg'
}

const current = ref('lg')

export function useBreakpoint() {
  function update() {
    current.value = getBreakpoint()
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return {
    breakpoint: current,
    isMobile: computed(() => current.value === 'sm'),
    isTablet: computed(() => current.value === 'md'),
    isDesktop: computed(() => current.value === 'lg'),
    update,
  }
}
