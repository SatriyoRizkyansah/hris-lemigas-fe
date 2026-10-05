import { Signal, signal, computed, batch } from './signal'

/**
 * Utility functions for signal operations
 */

/**
 * Create a signal from a promise
 */
export function fromPromise<T>(promise: Promise<T>, initialValue: T): Signal<{ value: T; loading: boolean; error: Error | null }> {
  const state = signal({
    value: initialValue,
    loading: true,
    error: null as Error | null,
  })

  promise
    .then((value) => {
      batch(() => {
        state.value = {
          value,
          loading: false,
          error: null,
        }
      })
    })
    .catch((error) => {
      batch(() => {
        state.value = {
          value: initialValue,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }
      })
    })

  return state
}

/**
 * Create a signal from an observable-like object
 */
export function fromObservable<T>(
  observable: {
    subscribe: (observer: (value: T) => void) => { unsubscribe: () => void }
  },
  initialValue: T
): Signal<T> {
  const state = signal(initialValue)

  const subscription = observable.subscribe((value) => {
    state.value = value
  })

  // Store unsubscribe function on the signal for cleanup
  ;(state as any)._unsubscribe = subscription.unsubscribe

  return state
}

/**
 * Transform a signal value
 */
export function map<T, U>(signal: Signal<T>, fn: (value: T) => U): Signal<U> {
  return computed(() => fn(signal.value))
}

/**
 * Filter signal updates based on a predicate
 */
export function filter<T>(signal: Signal<T>, predicate: (value: T) => boolean): Signal<T | undefined> {
  return computed(() => {
    const value = signal.value
    return predicate(value) ? value : undefined
  })
}

/**
 * Combine multiple signals into one
 */
export function combine<T extends readonly Signal<any>[]>(
  signals: T
): Signal<{ [K in keyof T]: T[K] extends Signal<infer U> ? U : never }> {
  return computed(() => {
    return signals.map((s) => s.value) as any
  })
}

/**
 * Combine multiple signals into an object
 */
export function combineObject<T extends Record<string, Signal<any>>>(
  signals: T
): Signal<{ [K in keyof T]: T[K] extends Signal<infer U> ? U : never }> {
  return computed(() => {
    const result = {} as any
    for (const key in signals) {
      result[key] = signals[key].value
    }
    return result
  })
}

/**
 * Debounce signal updates
 */
export function debounce<T>(sourceSignal: Signal<T>, delay: number): Signal<T> {
  const debouncedSignal = signal(sourceSignal.value)
  let timeoutId: NodeJS.Timeout | null = null

  sourceSignal.subscribe(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      debouncedSignal.value = sourceSignal.value
      timeoutId = null
    }, delay)
  })

  return debouncedSignal
}

/**
 * Throttle signal updates
 */
export function throttle<T>(sourceSignal: Signal<T>, delay: number): Signal<T> {
  const throttledSignal = signal(sourceSignal.value)
  let lastUpdate = 0
  let timeoutId: NodeJS.Timeout | null = null

  sourceSignal.subscribe(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdate

    if (timeSinceLastUpdate >= delay) {
      throttledSignal.value = sourceSignal.value
      lastUpdate = now
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        throttledSignal.value = sourceSignal.value
        lastUpdate = Date.now()
        timeoutId = null
      }, delay - timeSinceLastUpdate)
    }
  })

  return throttledSignal
}

/**
 * Create a signal that only updates when the value actually changes
 */
export function distinct<T>(sourceSignal: Signal<T>, compareFn?: (a: T, b: T) => boolean): Signal<T> {
  const distinctSignal = signal(sourceSignal.value)
  let lastValue = sourceSignal.value

  const compare = compareFn || ((a, b) => a === b)

  sourceSignal.subscribe(() => {
    const newValue = sourceSignal.value
    if (!compare(lastValue, newValue)) {
      lastValue = newValue
      distinctSignal.value = newValue
    }
  })

  return distinctSignal
}

/**
 * Create a signal that emits the previous value along with current
 */
export function withPrevious<T>(signal: Signal<T>): Signal<{ current: T; previous: T | undefined }> {
  let previousValue: T | undefined = undefined

  return computed(() => {
    const current = signal.value
    const result = { current, previous: previousValue }
    previousValue = current
    return result
  })
}

/**
 * Create a signal that counts updates
 */
export function withCount<T>(signal: Signal<T>): Signal<{ value: T; count: number }> {
  let count = 0

  return computed(() => {
    count++
    return { value: signal.value, count }
  })
}

/**
 * Create a signal from localStorage
 */
export function fromLocalStorage<T>(
  key: string,
  defaultValue: T,
  serializer: {
    serialize: (value: T) => string
    deserialize: (value: string) => T
  } = {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  }
): Signal<T> {
  // Get initial value from localStorage
  let initialValue = defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      initialValue = serializer.deserialize(stored)
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error)
  }

  const state = signal(initialValue)

  // Subscribe to changes and update localStorage
  state.subscribe(() => {
    try {
      localStorage.setItem(key, serializer.serialize(state.value))
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error)
    }
  })

  // Listen for storage events from other tabs
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = serializer.deserialize(e.newValue)
          state.value = newValue
        } catch (error) {
          console.warn(`Failed to sync ${key} from localStorage:`, error)
        }
      }
    })
  }

  return state
}

/**
 * Create a signal from sessionStorage
 */
export function fromSessionStorage<T>(
  key: string,
  defaultValue: T,
  serializer: {
    serialize: (value: T) => string
    deserialize: (value: string) => T
  } = {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  }
): Signal<T> {
  // Get initial value from sessionStorage
  let initialValue = defaultValue
  try {
    const stored = sessionStorage.getItem(key)
    if (stored !== null) {
      initialValue = serializer.deserialize(stored)
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from sessionStorage:`, error)
  }

  const state = signal(initialValue)

  // Subscribe to changes and update sessionStorage
  state.subscribe(() => {
    try {
      sessionStorage.setItem(key, serializer.serialize(state.value))
    } catch (error) {
      console.warn(`Failed to save ${key} to sessionStorage:`, error)
    }
  })

  return state
}
