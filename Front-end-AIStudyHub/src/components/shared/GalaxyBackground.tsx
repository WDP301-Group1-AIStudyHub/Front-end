import { useEffect, useRef } from 'react'

export default function GalaxyBackground() {
  const starContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const createShootingStar = () => {
      const container = starContainerRef.current
      if (!container) return

      const star = document.createElement('div')
      star.className = 'lp-shooting-star'
      star.style.left = `${Math.random() * window.innerWidth + 500}px`
      star.style.top = `${Math.random() * window.innerHeight - 200}px`
      star.style.animationDuration = `${Math.random() * 2 + 1}s`
      star.style.opacity = `${Math.random()}`

      container.appendChild(star)
      window.setTimeout(() => star.remove(), 3000)
    }

    const starInterval = window.setInterval(createShootingStar, 1500)

    return () => {
      window.clearInterval(starInterval)
    }
  }, [])

  return (
    <div className="lp-galaxy-bg" aria-hidden="true">
      <div className="lp-spiral-container" />
      <div ref={starContainerRef} />
    </div>
  )
}
