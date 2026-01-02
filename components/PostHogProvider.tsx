'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
  })
}

function PostHogIdentify() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.email) {
      const email = session.user.email
      const identifiedKey = `posthog_identified_${email}`

      // Check if this is a new user (first time identifying)
      const wasIdentified = localStorage.getItem(identifiedKey)

      posthog.identify(email, {
        email: email,
        name: session.user.name,
      })

      if (!wasIdentified) {
        posthog.capture('user_signed_up')
        localStorage.setItem(identifiedKey, 'true')
      }
    }
  }, [session?.user?.email, session?.user?.name])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PHProvider>
  )
}
