import { loading_overlay_signal } from './loading-init-signal'
import { smart_show_loading, smart_close_loading, reset_smart_loading } from './smart-loading-signal'

// Debounce timers untuk optimasi loading berulang
let showLoadingTimer: ReturnType<typeof setTimeout> | null = null
let hideLoadingTimer: ReturnType<typeof setTimeout> | null = null
let activeLoadingCount = 0

const updateLoadingState = () => {
  loading_overlay_signal.value = activeLoadingCount > 0
}

export function set_loading_to(type: boolean) {
  if (type) {
    activeLoadingCount++
    smart_show_loading()
  } else {
    activeLoadingCount = Math.max(0, activeLoadingCount - 1)
    smart_close_loading()
  }
  updateLoadingState()
}

export function show_loading(delay = 0) {
  // Clear hide timer jika ada
  if (hideLoadingTimer) {
    clearTimeout(hideLoadingTimer)
    hideLoadingTimer = null
  }

  if (delay > 0) {
    showLoadingTimer = setTimeout(() => {
      set_loading_to(true)
      showLoadingTimer = null
    }, delay)
  } else {
    set_loading_to(true)
  }
}

export function close_loading(delay = 0) {
  // Clear show timer jika ada
  if (showLoadingTimer) {
    clearTimeout(showLoadingTimer)
    showLoadingTimer = null
  }

  if (delay > 0) {
    hideLoadingTimer = setTimeout(() => {
      set_loading_to(false)
      hideLoadingTimer = null
    }, delay)
  } else {
    set_loading_to(false)
  }
}

// Cleanup function untuk mencegah memory leaks
export function cleanup_loading_timers() {
  if (showLoadingTimer) {
    clearTimeout(showLoadingTimer)
    showLoadingTimer = null
  }
  if (hideLoadingTimer) {
    clearTimeout(hideLoadingTimer)
    hideLoadingTimer = null
  }

  // Pastikan state kembali bersih
  activeLoadingCount = 0
  reset_smart_loading()
  updateLoadingState()
}
