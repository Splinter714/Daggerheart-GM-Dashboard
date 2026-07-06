import { useEffect, useRef } from 'react'

// Force-restarts the "just added" confirmation pulse (#55) on a card's DOM
// node whenever its pulse token changes — including while the card is still
// mid-pulse from a previous add (e.g. adding a 2nd/3rd instance of an
// already-present type in quick succession). GameCard's isRecentlyAdded prop
// stays a plain boolean, so if a card's token changes but the boolean was
// already true, the className string reapplied across renders is identical —
// a DOM no-op — and the CSS animation would not otherwise replay. Removing
// the class, forcing a reflow, then re-adding it (queried via the stable
// data-card-key already on each card's wrapper Panel) guarantees the
// box-shadow pulse actually restarts every time a new token comes in.
export const useRecentlyAddedPulseRestart = (recentlyAddedCards, containerRef) => {
  const seenTokens = useRef(new Map())
  useEffect(() => {
    recentlyAddedCards.forEach((token, cardKey) => {
      if (seenTokens.current.get(cardKey) === token) return
      seenTokens.current.set(cardKey, token)
      const el = containerRef.current?.querySelector(`[data-card-key="${cardKey}"] .card-recently-added`)
      if (!el) return
      el.classList.remove('card-recently-added')
      void el.offsetWidth // force reflow
      el.classList.add('card-recently-added')
    })
  }, [recentlyAddedCards, containerRef])
}

export default useRecentlyAddedPulseRestart
