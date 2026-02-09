import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue'

/* sm <768 H5 | md 768-1000 平板 | lg ≥1000 PC */
const WIDTH = { sm: 768, md: 1000 }

type Breakpoint = 'sm' | 'md' | 'lg'

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'lg'
  const w = window.innerWidth
  if (w < WIDTH.sm) return 'sm'
  if (w < WIDTH.md) return 'md'
  return 'lg'
}

const current: Ref<Breakpoint> = ref('lg')

export function useBreakpoint() {
  function update(): void {
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
    isMobile: computed(() => current.value === 'sm') as ComputedRef<boolean>,
    isTablet: computed(() => current.value === 'md') as ComputedRef<boolean>,
    isDesktop: computed(() => current.value === 'lg') as ComputedRef<boolean>,
    update,
  }
}
