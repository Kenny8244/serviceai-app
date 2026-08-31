import { createContext, useContext, useState, type ReactNode } from 'react'

interface LayoutSlotsContextValue {
  headerHost: HTMLElement | null
  setHeaderHost: (node: HTMLElement | null) => void
}

const LayoutSlotsContext = createContext<LayoutSlotsContextValue | null>(null)

export function LayoutSlotsProvider({ children }: { children: ReactNode }) {
  const [headerHost, setHeaderHost] = useState<HTMLElement | null>(null)

  return (
    <LayoutSlotsContext.Provider value={{ headerHost, setHeaderHost }}>
      {children}
    </LayoutSlotsContext.Provider>
  )
}

export function useLayoutSlots() {
  return useContext(LayoutSlotsContext)
}

export function HeaderSlot() {
  const slots = useLayoutSlots()

  return <div className="shrink-0" ref={slots?.setHeaderHost ?? undefined} />
}
