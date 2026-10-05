import { useEffect } from 'react'

/**
 * Custom hook to listen for refresh events
 * Automatically cleans up event listener on unmount
 *
 * @param eventName - Name of the event to listen for (e.g., 'refreshMasterGedungData')
 * @param callback - Function to call when event is triggered
 *
 * @example
 * ```tsx
 * useRefreshListener('refreshMasterGedungData', query.call_back)
 * ```
 */
export function useRefreshListener(eventName: string, callback?: () => void) {
  useEffect(() => {
    if (!callback) return

    const handleRefresh = () => {
      callback()
    }

    window.addEventListener(eventName, handleRefresh)

    return () => {
      window.removeEventListener(eventName, handleRefresh)
    }
  }, [eventName, callback])
}

/**
 * Trigger a refresh event
 * @param eventName - Name of the event to trigger
 */
export function triggerRefresh(eventName: string) {
  window.dispatchEvent(new Event(eventName))
}
