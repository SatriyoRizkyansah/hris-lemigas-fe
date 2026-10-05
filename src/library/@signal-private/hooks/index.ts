/**
 * Signal Library - React-compatible signal implementation
 *
 * A complete signal library inspired by Preact signals, designed to work
 * seamlessly with React applications. Provides reactive state management
 * with automatic dependency tracking and optimized re-renders.
 *
 * @author Generated for LPTI xignature-frontend
 * @version 1.0.0
 */

// Core signal implementation
export { Signal, signal, computed, effect, batch, isSignal } from "@Signal/signal";

// React hooks integration
export { useSignal, useSignalValue, useComputed, useSignalEffect, useBatch, useCreateSignal, useCreateComputed, withSignals, useSignals } from "@Signal/hooks/hooks";
