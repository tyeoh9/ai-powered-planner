'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="sign-out-button"
      title="Sign out"
    >
      Sign out
    </button>
  )
}
