'use client'

import { useSession, signOut, signIn } from 'next-auth/react'
import Link from 'next/link'

export function NavBar() {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Left: Logo */}
        <Link href={session ? '/' : '/login'} className="navbar-logo">
          <img src="/octopus.svg?v=2" alt="Inky" width={32} height={32} />
          <span className="navbar-brand">inky</span>
        </Link>

        {/* Spacer */}
        <div className="navbar-spacer" />

        {/* Right: Nav items + Actions */}
        <div className="navbar-items">
          {session && (
            <Link href="/" className="navbar-tab active">
              Documents
            </Link>
          )}

          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="navbar-action"
            >
              Sign Out
            </button>
          ) : (
            !isLoading && (
              <>
                <Link href="/features" className="navbar-tab">
                  Features
                </Link>
                <Link href="/changelog" className="navbar-tab">
                  Changelog
                </Link>
                <button
                  onClick={() => signIn('google', { callbackUrl: '/' })}
                  className="navbar-action-primary"
                >
                  Sign In
                </button>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  )
}
