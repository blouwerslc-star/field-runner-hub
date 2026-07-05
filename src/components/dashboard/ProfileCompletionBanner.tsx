import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Sparkles, X, ShieldCheck } from 'lucide-react'

const DISMISS_KEY = 'rei-profile-banner-dismissed-until'

type Role = 'runner' | 'investor'

export function ProfileCompletionBanner({ role }: { role: Role }) {
  const [steps, setSteps] = useState<{ label: string; href: string }[] | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedUntil > Date.now()) {
      setHidden(true)
      return
    }
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('profile_photo_url, bio, city, state, company_name, company_description, verification_level')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled || !p) return

      const missing: { label: string; href: string }[] = []
      const editHref = '/profile/edit'
      const onboardingHref = '/onboarding'
      if (!p.profile_photo_url) missing.push({ label: 'Add a profile photo', href: role === 'runner' ? onboardingHref : editHref })
      if (!p.city || !p.state) missing.push({ label: 'Add your city & state', href: role === 'runner' ? onboardingHref : editHref })
      if (role === 'runner') {
        if (!p.bio) missing.push({ label: 'Write a short bio', href: onboardingHref })
        if ((p.verification_level ?? 0) < 1)
          missing.push({ label: 'Complete identity verification', href: onboardingHref })
      } else {
        if (!p.company_name) missing.push({ label: 'Add your company name', href: editHref })
        if (!p.company_description)
          missing.push({ label: 'Add a company description', href: editHref })
      }
      setSteps(missing)
    })()
    return () => {
      cancelled = true
    }
  }, [role])

  if (hidden || !steps || steps.length === 0) return null

  function dismiss() {
    // Snooze for 7 days
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000))
    setHidden(true)
  }

  const primary = steps[0]

  return (
    <div className="relative rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 mb-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss for a week"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <h3 className="font-semibold">Finish setting up your account</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            We're still in beta and rolling out market by market. Complete these steps so
            you're ready the moment your area goes live.
          </p>
          <ul className="mt-3 text-sm space-y-1.5">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-amber-400 shrink-0" />
                <Link to={s.href} className="hover:underline">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black">
          <Link to={primary.href}>Continue setup</Link>
        </Button>
      </div>
    </div>
  )
}