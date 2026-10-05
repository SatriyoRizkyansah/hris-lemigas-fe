/**
 * Signal implementation inspired by Preact signals but compatible with React
 * Provides reactive state management with automatic dependency tracking
 */

type Subscriber = () => void
type ComputeFunction<T> = () => T

// Global state for tracking dependencies
let currentContext: Signal<any> | null = null
const batching = { pending: false, callbacks: new Set<() => void>() }

/**
 * Core Signal class that holds reactive values
 */
export class Signal<T = any> {
  private _value: T
  private _subscribers = new Set<Subscriber>()
  private _dependencies = new Set<Signal<any>>()
  private _dependents = new Map<Signal<any>, Subscriber>() // Track dependents with their callbacks
  private _computeFn?: ComputeFunction<T>
  private _isComputed: boolean
  private _isRecomputing = false // Prevent infinite loops

  constructor(value: T, computeFn?: ComputeFunction<T>) {
    this._value = value
    this._computeFn = computeFn
    this._isComputed = !!computeFn
  }

  get value(): T {
    // Register as dependency if we're inside a computed context
    if (currentContext && currentContext !== this) {
      // Check if this dependency relationship already exists
      if (!this._dependents.has(currentContext)) {
        const contextRef = currentContext // Capture the context reference
        const callback = () => {
          if (contextRef && typeof contextRef.notify === 'function') {
            contextRef.notify()
          }
        }
        this._subscribers.add(callback)
        this._dependents.set(currentContext, callback)
        currentContext._dependencies.add(this)
      }
    }

    // Recompute if this is a computed signal
    if (this._isComputed && this._computeFn) {
      this._recompute()
    }

    return this._value
  }

  set value(newValue: T) {
    if (this._isComputed) {
      throw new Error('Cannot set value of computed signal')
    }

    // Only prevent updates during recomputation for computed signals
    // Regular signals should always be able to update
    if (this._value !== newValue) {
      this._value = newValue
      this.notify()
    }
  }

  private _recompute(): void {
    // Prevent infinite loops during recomputation
    if (this._isRecomputing) {
      return
    }

    const prevContext = currentContext
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    currentContext = this
    this._isRecomputing = true

    // Clear old dependencies properly
    this._dependencies.forEach((dep) => {
      const callback = dep._dependents.get(this)
      if (callback) {
        dep._subscribers.delete(callback)
        dep._dependents.delete(this)
      }
    })
    this._dependencies.clear()

    try {
      const newValue = this._computeFn!()
      if (this._value !== newValue) {
        this._value = newValue
        this.notify()
      }
    } finally {
      currentContext = prevContext
      this._isRecomputing = false
    }
  }

  subscribe(callback: Subscriber): () => void {
    this._subscribers.add(callback)
    return () => {
      this._subscribers.delete(callback)
    }
  }

  notify(): void {
    if (batching.pending) {
      batching.callbacks.add(() => {
        this._subscribers.forEach((callback) => {
          if (callback) {
            callback()
          }
        })
      })
    } else {
      this._subscribers.forEach((callback) => {
        if (callback) {
          callback()
        }
      })
    }
  }

  peek(): T {
    return this._value
  }

  toJSON(): T {
    return this._value
  }

  toString(): string {
    return String(this._value)
  }

  valueOf(): T {
    return this._value
  }
}

/**
 * Create a new signal with initial value
 */
export function signal<T>(initialValue: T): Signal<T> {
  return new Signal(initialValue)
}

/**
 * Create a computed signal that automatically updates based on dependencies
 */
export function computed<T>(computeFn: ComputeFunction<T>): Signal<T> {
  const computedSignal = new Signal(undefined as any, computeFn)
  // Force initial computation
  void computedSignal.value
  return computedSignal
}

/**
 * Run a function with automatic dependency tracking
 */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void
  const effectSignal = computed(() => {
    if (cleanup) cleanup()
    cleanup = fn()
  })

  // Subscribe to trigger the effect
  const unsubscribe = effectSignal.subscribe(() => {})

  return () => {
    if (cleanup) cleanup()
    unsubscribe()
  }
}

/**
 * Batch multiple signal updates to prevent unnecessary re-renders
 */
export function batch(fn: () => void): void {
  if (batching.pending) {
    fn()
    return
  }

  batching.pending = true
  fn()
  batching.pending = false

  // Execute all batched callbacks
  const callbacks = Array.from(batching.callbacks)
  batching.callbacks.clear()
  callbacks.forEach((callback) => callback())
}

/**
 * Utility to check if a value is a signal
 */
export function isSignal(value: any): value is Signal<any> {
  return value instanceof Signal
}
