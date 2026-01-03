'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, ReactNode, useRef } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [displayChildren, setDisplayChildren] = useState(children)
  const isFirstRender = useRef(true)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Only animate if pathname actually changed
    if (prevPathname.current === pathname) {
      setDisplayChildren(children)
      return
    }

    prevPathname.current = pathname

    // Start fade out
    setIsVisible(false)
    
    // After fade out completes, update children and fade in
    const fadeOutTimer = setTimeout(() => {
      setDisplayChildren(children)
      
      // Small delay before fade in for smoother transition
      const fadeInTimer = setTimeout(() => {
        setIsVisible(true)
      }, 50)

      return () => clearTimeout(fadeInTimer)
    }, 400) // Longer fade out duration

    return () => clearTimeout(fadeOutTimer)
  }, [pathname, children])

  return (
    <div
      style={{
        transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {displayChildren}
    </div>
  )
}
