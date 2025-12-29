'use client'

import Image from 'next/image'

export function AppAvatar() {
  return (
    <div className="app-avatar float-animation">
      <Image
        src="/octopus.svg"
        alt="Octopus mascot"
        width={48}
        height={48}
        priority
        unoptimized
      />
    </div>
  )
}
