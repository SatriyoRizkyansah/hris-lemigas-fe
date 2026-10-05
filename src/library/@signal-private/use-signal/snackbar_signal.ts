import { signal } from '@Signal/signal'
import { type SnackbarProps } from '@mui/material'

export type ToOptional<T> = {
  [P in keyof T]?: T[P]
}

export type AlertSignalType = {
  open: boolean
  severity: 'success' | 'error' | 'warning' | 'info'
  message: string
  autoHideDuration: number
  anchorOrigin: SnackbarProps['anchorOrigin']
  variant: 'filled' | 'outlined' | 'standard'
}

export const alert_signal = signal<AlertSignalType>({
  open: false,
  severity: 'info',
  message: '',
  autoHideDuration: 2000,
  anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
  variant: 'filled',
})

export function show_alert_snackbar(props: ToOptional<AlertSignalType>) {
  alert_signal.value = {
    ...alert_signal.value,
    ...props,
    open: true,
  }
}

export function close_alert() {
  alert_signal.value = {
    ...alert_signal.value,
    open: false,
  }
}
