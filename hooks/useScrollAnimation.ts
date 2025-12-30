'use client'

import { useEffect, useRef, useState } from 'react'

export function useScrollAnimation<T extends HTMLElement>(
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element) // Only animate once
        }
      },
      {
        threshold: 0,
        ...options,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [options])

  return { ref, isVisible }
}
