/**
 * TypeScript type definitions for the Signal library
 */

/**
 * Core signal types
 */
export interface ISignal<T = any> {
  readonly value: T
  subscribe(callback: () => void): () => void
  peek(): T
  notify(): void
}

export interface IWritableSignal<T = any> extends ISignal<T> {
  value: T
}

export interface IComputedSignal<T = any> extends ISignal<T> {
  readonly value: T
}

/**
 * Signal creation function types
 */
export type SignalFactory = {
  <T>(initialValue: T): IWritableSignal<T>
}

export type ComputedFactory = {
  <T>(computeFn: () => T): IComputedSignal<T>
}

/**
 * Effect and batch types
 */
export type EffectFunction = () => void | (() => void)
export type EffectCleanup = () => void
export type BatchFunction = () => void

/**
 * Utility function types
 */
export interface AsyncSignalState<T> {
  value: T
  loading: boolean
  error: Error | null
}

export interface SignalWithPrevious<T> {
  current: T
  previous: T | undefined
}

export interface SignalWithCount<T> {
  value: T
  count: number
}

export interface Observable<T> {
  subscribe(observer: (value: T) => void): { unsubscribe: () => void }
}

export interface Serializer<T> {
  serialize: (value: T) => string
  deserialize: (value: string) => T
}

/**
 * React hook types
 */
export type UseSignalReturn<T> = [T, (value: T | ((prev: T) => T)) => void]

export type UseSignalsReturn<T extends Record<string, any>> = [T, (updates: Partial<T>) => void]

/**
 * Higher-order component types
 */
export type WithSignalsHOC = <P extends object>(Component: React.ComponentType<P>) => React.ComponentType<P>

/**
 * Predicate and transform function types
 */
export type PredicateFunction<T> = (value: T) => boolean
export type TransformFunction<T, U> = (value: T) => U
export type CompareFunction<T> = (a: T, b: T) => boolean

/**
 * Signal utility types
 */
export type SignalTuple<T extends readonly ISignal<any>[]> = {
  [K in keyof T]: T[K] extends ISignal<infer U> ? U : never
}

export type SignalRecord<T extends Record<string, ISignal<any>>> = {
  [K in keyof T]: T[K] extends ISignal<infer U> ? U : never
}

/**
 * Advanced signal types
 */
export interface DebouncedSignal<T> extends ISignal<T> {
  readonly delay: number
  cancel(): void
}

export interface ThrottledSignal<T> extends ISignal<T> {
  readonly delay: number
  flush(): void
}

/**
 * Storage signal types
 */
export interface StorageSignalOptions<T> {
  key: string
  defaultValue: T
  serializer?: Serializer<T>
  storage?: Storage
}

/**
 * Promise signal types
 */
export interface PromiseSignalOptions<T> {
  promise: Promise<T>
  initialValue: T
  onError?: (error: Error) => void
  onSuccess?: (value: T) => void
}

/**
 * Signal state management types
 */
export interface SignalStore<T extends Record<string, any>> {
  signals: Record<keyof T, IWritableSignal<T[keyof T]>>
  get<K extends keyof T>(key: K): T[K]
  set<K extends keyof T>(key: K, value: T[K]): void
  update<K extends keyof T>(key: K, updater: (prev: T[K]) => T[K]): void
  batch(fn: () => void): void
  subscribe(callback: () => void): () => void
  reset(): void
}

/**
 * Signal middleware types
 */
export type SignalMiddleware<T = any> = {
  beforeSet?: (newValue: T, oldValue: T) => T | void
  afterSet?: (newValue: T, oldValue: T) => void
  onSubscribe?: (callback: () => void) => void
  onUnsubscribe?: (callback: () => void) => void
}

/**
 * Signal validation types
 */
export type SignalValidator<T> = (value: T) => boolean | string

export interface ValidatedSignalOptions<T> {
  initialValue: T
  validator?: SignalValidator<T>
  onValidationError?: (error: string, value: T) => void
}

/**
 * Performance monitoring types
 */
export interface SignalPerformanceMetrics {
  subscriptionCount: number
  updateCount: number
  computationTime: number
  lastUpdateTime: number
}

/**
 * Signal debugging types
 */
export interface SignalDebugInfo<T = any> {
  id: string
  name?: string
  value: T
  subscriptions: number
  isComputed: boolean
  dependencies: string[]
  metrics: SignalPerformanceMetrics
}
