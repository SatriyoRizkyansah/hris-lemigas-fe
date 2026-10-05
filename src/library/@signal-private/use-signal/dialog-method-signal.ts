import { type DialogProps } from '@mui/material'
import { dialog_signal, type DialogSignalType } from './dialog-init-signal'

export type OpenDialogProps = {
  size: DialogProps['maxWidth']
  fullscreen?: boolean
} & DialogSignalType

export function show_dialog({
  render_component,
  size,
  should_disabled_clickaway_close,
  fullscreen,
  should_close_for_one_clickaway,
  dialog_props: props,
}: OpenDialogProps) {
  dialog_signal.value = {
    ...dialog_signal.value,
    open: true,
    render_component,
    dialog_props: {
      fullWidth: true,
      maxWidth: size,
      fullScreen: fullscreen,
      ...props,
    },
    should_disabled_clickaway_close,
    should_close_for_one_clickaway,
  }
}

export function close_dialog() {
  dialog_signal.value = { ...dialog_signal.value, open: false }
}
