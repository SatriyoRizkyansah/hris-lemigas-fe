import { signal } from "@Signal/signal";

export const LOADING_DELAY_MS = 300; // Jangan tampilkan loading jika < 300ms
export const MIN_DISPLAY_DURATION_MS = 200; // Durasi minimum tampilan loading untuk smooth transition

// Track waktu mulai loading
let loadingStartTime: number | null = null;
let loadingDisplayTimeout: ReturnType<typeof setTimeout> | null = null;
let loadingHideTimeout: ReturnType<typeof setTimeout> | null = null; // Track timeout untuk hide
let activeLoadingCount = 0;

export const smart_loading_overlay_signal = signal<boolean>(false);

/**
 * Smart show loading dengan delay otomatis
 * Jika loading selesai sebelum 300ms, tidak akan menampilkan overlay
 */
export function smart_show_loading() {
  activeLoadingCount++;

  if (!loadingStartTime) {
    loadingStartTime = Date.now();
  }

  // Clear previous timeout jika ada
  if (loadingDisplayTimeout) {
    clearTimeout(loadingDisplayTimeout);
  }

  // Schedule display loading setelah LOADING_DELAY_MS
  loadingDisplayTimeout = setTimeout(() => {
    smart_loading_overlay_signal.value = true;
    loadingDisplayTimeout = null;
  }, LOADING_DELAY_MS);
}

/**
 * Smart close loading
 * Jika waktu loading < LOADING_DELAY_MS, tidak akan tampilkan loading sama sekali
 */
export function smart_close_loading() {
  activeLoadingCount = Math.max(0, activeLoadingCount - 1);

  if (activeLoadingCount === 0 && loadingStartTime) {
    const duration = Date.now() - loadingStartTime;

    // Jika loading sudah di-display, tunggu minimal MIN_DISPLAY_DURATION_MS sebelum hide untuk smooth transition
    if (loadingDisplayTimeout === null) {
      // Loading sudah di-display
      const remainingTime = Math.max(0, MIN_DISPLAY_DURATION_MS - (duration - LOADING_DELAY_MS));

      loadingHideTimeout = setTimeout(() => {
        smart_loading_overlay_signal.value = false;
        loadingStartTime = null;
        loadingHideTimeout = null;
      }, remainingTime);
    } else {
      // Loading belum di-display, langsung clear
      clearTimeout(loadingDisplayTimeout);
      loadingDisplayTimeout = null;
      smart_loading_overlay_signal.value = false;
      loadingStartTime = null;
    }
  }
}

export function reset_smart_loading() {
  if (loadingDisplayTimeout) {
    clearTimeout(loadingDisplayTimeout);
    loadingDisplayTimeout = null;
  }
  if (loadingHideTimeout) {
    clearTimeout(loadingHideTimeout);
    loadingHideTimeout = null;
  }
  activeLoadingCount = 0;
  loadingStartTime = null;
  smart_loading_overlay_signal.value = false;
}
