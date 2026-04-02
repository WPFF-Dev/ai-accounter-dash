'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { motion } from 'framer-motion'
import { BarChart3, Shield, Zap, Globe } from 'lucide-react'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard/sheets')
    }
  }, [status, router])

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard/sheets' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel – hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">AI Accountant Dash</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Financial intelligence<br />
              <span className="text-brand-400">from your spreadsheets</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Connect your Google Sheets and unlock beautiful analytics, spending insights, and AI-powered recommendations.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Shield, title: 'Read-only access', desc: 'We never modify your data' },
              { icon: Zap, title: 'Instant insights', desc: 'Auto-detect columns and structure' },
              { icon: Globe, title: 'Multi-language', desc: 'EN, HE, RU, UA with RTL support' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{title}</div>
                  <div className="text-slate-400 text-sm">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          © 2026 AI Accountant Dash
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">AI Accountant Dash</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold">{t('login.title')}</h2>
            <p className="mt-2 text-[hsl(var(--muted-fg))]">{t('login.subtitle')}</p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl
                       border border-[hsl(var(--border))] bg-[hsl(var(--surface))]
                       hover:bg-[hsl(var(--surface-raised))] hover:border-[hsl(var(--muted-fg))/30]
                       transition-all duration-150 font-medium text-base
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[hsl(var(--muted-fg))] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? t('common.loading') : t('login.button')}
          </button>

          <p className="text-center text-sm text-[hsl(var(--muted-fg))]">
            <Shield className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
            {t('login.privacy')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
