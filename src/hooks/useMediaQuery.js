import { useEffect, useState } from 'react'

/**
 * @param {string} query
 * @param {boolean} [defaultValue=false]
 */
export function useMediaQuery(query, defaultValue = false) {
  const [matches, setMatches] = useState(defaultValue)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const m = window.matchMedia(query)
    const onChange = () => setMatches(m.matches)

    setMatches(m.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)', false)
}
