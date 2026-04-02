'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
  value: string
  onValueChange: (v: string) => void
}

const TabsContext = createContext<TabsContextType>({ value: '', onValueChange: () => {} })

export function Tabs({ value, onValueChange, children }: {
  value: string
  onValueChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className="space-y-4">{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide
                    bg-[hsl(var(--surface-raised))] p-1 rounded-xl border border-[hsl(var(--border))]
                    w-fit max-w-full">
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150',
        active
          ? 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] shadow-sm'
          : 'text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))]'
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div>{children}</div>
}
