'use client'

import { Menu } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import LanguageSwitcher from './LanguageSwitcher'

interface Props {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: Props) {
  return (
    <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] flex items-center px-4 gap-3 shrink-0">
      <button onClick={onMenuClick} className="btn-ghost p-2 lg:hidden">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}
