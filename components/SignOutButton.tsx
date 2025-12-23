'use client'

import { signOut, useSession } from 'next-auth/react'

export function SignOutButton() {
  const { data: session } = useSession()
  const userName = session?.user?.name || (session?.user?.email?.includes('@') ? session.user.email.split('@')[0] : session?.user?.email)

  return (
    <div className="user-menu">
      {userName && <span className="user-name">{userName}</span>}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="sign-out-button"
        title="Sign out"
      >
        Sign out
      </button>
    </div>
  )
}
