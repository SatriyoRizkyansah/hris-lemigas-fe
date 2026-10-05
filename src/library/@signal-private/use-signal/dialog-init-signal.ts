import { signal } from '@Signal/signal'
import { type DialogProps } from '@mui/material'
import { ReactNode } from 'react'

export type DialogSignalType = {
  dialog_props?: ExclusiveOmit<DialogProps, 'open'>
  open?: boolean
  should_close_for_one_clickaway?: boolean
  should_disabled_clickaway_close?: boolean
  render_component?: ReactNode
}

export const dialog_signal = signal<DialogSignalType>({
  open: false,
  dialog_props: {},
  should_disabled_clickaway_close: false,
  should_close_for_one_clickaway: false,
  render_component: undefined,
})
