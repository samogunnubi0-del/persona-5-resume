import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { gsap } from 'gsap'

const Ctx = createContext(null)

export function DiveMenuProvider({ children }) {
  const [active, setActive] = useState(false)
  const overlayRef = useRef(null)
  const r1 = useRef(null)
  const r2 = useRef(null)
  const r3 = useRef(null)
  const idRef = useRef(0)

  const openDive = useCallback((href) => {
    if (href !== '#about' && href !== '#resume') {
      if (typeof href === 'string' && href.startsWith('#')) {
        const el = document.querySelector(href)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }
    const target = document.querySelector(href)
    if (!target) return
    const overlay = overlayRef.current
    const a = r1.current
    const b = r2.current
    const c = r3.current
    if (!overlay || !a || !b || !c) return

    idRef.current += 1
    const myId = idRef.current

    setActive(true)
    overlay.setAttribute('aria-hidden', 'false')
    overlay.style.display = 'flex'
    gsap.killTweensOf([a, b, c, overlay])

    gsap.set(overlay, { opacity: 0 })
    gsap.set([a, b, c], { opacity: 0, scale: 0.45, rotation: 0 })
    const tl = gsap.timeline()
    tl.to(overlay, { opacity: 1, duration: 0.12 })
    tl.to(
      a,
      { opacity: 1, scale: 1, duration: 0.32, ease: 'sine.out' },
      0
    )
    tl.to(
      b,
      { opacity: 0.9, scale: 1, duration: 0.36, ease: 'sine.out' },
      0.04
    )
    tl.to(
      c,
      { opacity: 0.88, scale: 1, duration: 0.4, ease: 'sine.out' },
      0.08
    )
    const spinA = gsap.to(a, { rotation: 360, duration: 0.8, ease: 'none' })
    const spinB = gsap.to(b, { rotation: -360, duration: 0.8, ease: 'none' })
    const spinC = gsap.to(c, { rotation: 180, duration: 0.8, ease: 'none' })
    tl.add(() => {
      if (idRef.current === myId) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' })
      }
    }, 0.8)
    tl.to(
      overlay,
      {
        opacity: 0,
        duration: 0.35,
        ease: 'sine.in',
        onComplete: () => {
          if (idRef.current !== myId) return
          spinA.kill()
          spinB.kill()
          spinC.kill()
          overlay.style.display = 'none'
          overlay.setAttribute('aria-hidden', 'true')
          setActive(false)
        }
      },
      0.84
    )
  }, [])

  return (
    <Ctx.Provider value={{ openDive }}>
      {children}
      <div
        id="dive-menu-overlay"
        className="dive-menu-overlay"
        ref={overlayRef}
        aria-hidden={!active}
        style={{ display: 'none' }}
      >
        <div className="dive-menu-rings" aria-hidden="true">
          <div ref={r1} className="dive-ring r1" />
          <div ref={r2} className="dive-ring r2" />
          <div ref={r3} className="dive-ring r3" />
        </div>
      </div>
    </Ctx.Provider>
  )
}

export function useDiveMenu() {
  const v = useContext(Ctx)
  if (!v) {
    return { openDive: (href) => {
      if (typeof href === 'string' && href.startsWith('#')) {
        const el = document.querySelector(href)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } }
  }
  return v
}

export function DiveCommandLink({ href, children, className = '' }) {
  const { openDive } = useDiveMenu()
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        openDive(href)
      }}
    >
      {children}
    </a>
  )
}
