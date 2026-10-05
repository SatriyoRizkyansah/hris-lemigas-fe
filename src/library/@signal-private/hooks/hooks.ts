/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/refs */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Signal, signal as createSignal, computed as createComputed, batch, effect } from "@Signal/signal";

/**
 * React hook to subscribe to a signal and re-render when it changes
 */
export function useSignal<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const signalRef = useRef<Signal<T> | null>(null);
  const [, forceUpdate] = useState({});

  // Initialize signal only once
  if (!signalRef.current) {
    const resolvedInitialValue = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;

    signalRef.current = createSignal(resolvedInitialValue);
  }

  // Subscribe to signal changes
  useEffect(() => {
    const signal = signalRef.current!;
    const unsubscribe = signal.subscribe(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  const setValue = useCallback((value: React.SetStateAction<T>) => {
    if (signalRef.current) {
      if (typeof value === "function") {
        const fn = value as (prev: T) => T;
        signalRef.current.value = fn(signalRef.current.value);
      } else {
        signalRef.current.value = value;
      }
    }
  }, []);

  return [signalRef.current.value, setValue];
}

/**
 * React hook to create a signal from an external signal and subscribe to it
 */
export function useSignalValue<T>(signal: Signal<T>): T {
  // Force re-render by incrementing a counter
  const [, forceUpdate] = useState({});
  const rerender = useCallback(() => {
    forceUpdate({});
  }, []);

  const [value, setValue] = useState(() => {
    return signal.peek();
  });

  useEffect(() => {
    // Immediately sync with current signal value
    setValue(signal.peek());

    // Subscribe to signal changes
    const unsubscribe = signal.subscribe(() => {
      const newValue = signal.peek();
      setValue(newValue);

      // Force re-render as backup
      rerender();
    });

    return () => {
      unsubscribe();
    };
  }, [signal, rerender]);

  return value;
}

/**
 * React hook to create a computed signal that depends on other signals
 */
export function useComputed<T>(computeFn: () => T, deps: React.DependencyList = []): T {
  const computedRef = useRef<Signal<T> | null>(null);
  const [value, setValue] = useState<T>();

  // Create computed signal when dependencies change
  useMemo(() => {
    computedRef.current = createComputed(computeFn);
    setValue(computedRef.current.value);
  }, deps);

  // Subscribe to computed signal changes
  useEffect(() => {
    if (!computedRef.current) return;

    const unsubscribe = computedRef.current.subscribe(() => {
      if (computedRef.current) {
        setValue(computedRef.current.value);
      }
    });

    return unsubscribe;
  }, [computedRef.current]);

  return value as T;
}

/**
 * React hook to create an effect that runs when dependencies change
 */
export function useSignalEffect(fn: () => void | (() => void), deps: React.DependencyList = []): void {
  useEffect(() => {
    return effect(fn);
  }, deps);
}

/**
 * React hook to batch multiple signal updates
 */
export function useBatch(): (fn: () => void) => void {
  return useCallback((fn: () => void) => {
    batch(fn);
  }, []);
}

/**
 * React hook that returns a stable reference to create signals
 */
export function useCreateSignal(): <T>(initialValue: T) => Signal<T> {
  return useCallback(<T>(initialValue: T) => {
    return createSignal(initialValue);
  }, []);
}

/**
 * React hook that returns a stable reference to create computed signals
 */
export function useCreateComputed(): <T>(computeFn: () => T) => Signal<T> {
  return useCallback(<T>(computeFn: () => T) => {
    return createComputed(computeFn);
  }, []);
}

/**
 * Higher-order component that provides signal context
 */
export function withSignals<P extends object>(Component: React.ComponentType<P>): React.ComponentType<P> {
  return function SignalProvider(props: P) {
    return React.createElement(Component, props);
  };
}

/**
 * Hook for creating multiple signals at once
 */
export function useSignals<T extends Record<string, any>>(initialValues: T): [T, (updates: Partial<T>) => void] {
  const signalsRef = useRef<Record<keyof T, Signal<T[keyof T]>> | null>(null);
  const [, forceUpdate] = useState({});

  // Initialize signals only once
  if (!signalsRef.current) {
    signalsRef.current = {} as Record<keyof T, Signal<T[keyof T]>>;
    Object.keys(initialValues).forEach((key) => {
      const k = key as keyof T;
      signalsRef.current![k] = createSignal(initialValues[k]);
    });
  }

  // Subscribe to all signal changes
  useEffect(() => {
    const signals = signalsRef.current!;
    const unsubscribers = Object.keys(signals).map((key) => {
      const k = key as keyof T;
      return signals[k].subscribe(() => forceUpdate({}));
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  // Get current values
  const currentValues = useMemo(() => {
    if (!signalsRef.current) return initialValues;

    const values = {} as T;
    Object.keys(signalsRef.current).forEach((key) => {
      const k = key as keyof T;
      values[k] = signalsRef.current![k].value;
    });
    return values;
  }, [signalsRef.current, forceUpdate]);

  const updateValues = useCallback((updates: Partial<T>) => {
    if (!signalsRef.current) return;

    batch(() => {
      Object.keys(updates).forEach((key) => {
        const k = key as keyof T;
        if (signalsRef.current![k] && updates[k] !== undefined) {
          signalsRef.current![k].value = updates[k]!;
        }
      });
    });
  }, []);

  return [currentValues, updateValues];
}
