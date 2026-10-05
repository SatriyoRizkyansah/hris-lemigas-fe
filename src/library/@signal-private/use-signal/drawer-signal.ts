import { computed, signal } from '@Signal/signal'

export const drawerOpen = signal(true)
export const drawerWidth = computed(() => (drawerOpen.value ? 250 : 0))
export const getDrawerWidth = () => drawerWidth.value
