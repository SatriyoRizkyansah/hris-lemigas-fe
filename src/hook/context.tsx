import { createContext, useContext } from 'react'
import { UseQueryReturnType } from './api-use-query'

export const PaginateContext = createContext<UseQueryReturnType<any, any, any>>({
  error: null,
  response: null,
  is_loading: false,
  call_back: () => {},
  params: {},
  symbol: '',
})

export const usePaginateCallback = () => useContext(PaginateContext).call_back
