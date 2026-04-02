'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import { BarChart3, FileSpreadsheet, LogOut, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { href: '/dashboard/sheets', icon: FileSpreadsheet, labelKey: 'nav.sheets' },
]

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useI18n()

  const navigate = (href: string) => {
    router.push(href)
    onClose()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--border))]">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-sm">{t('app.name')}</span>
        <button onClick={onClose} className="ml-auto lg:hidden btn-ghost p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => (
          <button
            key={href}
            onClick={() => navigate(href)}
            className={cn('nav-link w-full text-left', pathname.startsWith(href) && 'active')}
          >
            <Icon className="w-4 h-4" />
            {t(labelKey)}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[hsl(var(--border))] p-3 space-y-1">
        {session?.user && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ''}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
                {session.user.name?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{session.user.name}</div>
              <div className="text-xs text-[hsl(var(--muted-fg))] truncate">{session.user.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="nav-link w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          {t('nav.signout')}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))] shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))] lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
