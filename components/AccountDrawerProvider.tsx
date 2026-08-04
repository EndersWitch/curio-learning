'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import AccountDrawer from '@/components/AccountDrawer'

type AccountDrawerContextValue = {
  open: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const AccountDrawerContext = createContext<AccountDrawerContextValue | null>(null)

export function AccountDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openDrawer = useCallback(() => setOpen(true), [])
  const closeDrawer = useCallback(() => setOpen(false), [])

  return (
    <AccountDrawerContext.Provider value={{ open, openDrawer, closeDrawer }}>
      {children}
      <AccountDrawer open={open} onOpenChange={setOpen} />
    </AccountDrawerContext.Provider>
  )
}

export function useAccountDrawer() {
  const ctx = useContext(AccountDrawerContext)
  if (!ctx) throw new Error('useAccountDrawer must be used within AccountDrawerProvider')
  return ctx
}
