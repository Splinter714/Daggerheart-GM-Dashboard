import { useCallback, useRef, useState } from 'react'

const TOAST_DURATION_MS = 2000

/**
 * Tracks a brief "<Name> added" message for mobile users. On mobile the
 * browser panel covers the whole screen, so there's no other visual
 * confirmation that adding an adversary actually did anything (see #36).
 */
export function useAdversaryToast() {
  const [toastMessage, setToastMessage] = useState(null)
  const timeoutRef = useRef(null)

  const showAdversaryToast = useCallback((name) => {
    if (!name) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setToastMessage(`${name} added`)
    timeoutRef.current = setTimeout(() => {
      setToastMessage(null)
      timeoutRef.current = null
    }, TOAST_DURATION_MS)
  }, [])

  return { toastMessage, showAdversaryToast }
}

export { TOAST_DURATION_MS }
