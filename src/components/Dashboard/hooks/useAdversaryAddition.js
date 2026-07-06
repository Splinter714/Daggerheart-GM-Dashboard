import { useCallback } from 'react'
import { getCardScrollTarget } from './cardScrollTarget'

// How long the "just added" confirmation pulse stays visible (#55) — must
// match the CSS animation duration in DashboardView.css (.card-recently-added).
export const RECENTLY_ADDED_DURATION_MS = 1800

/**
 * Returns the monster addition handler that used to live inline in
 * DashboardView. Keeping it here makes the parent component far easier to scan
 * while preserving the scroll/animation behavior.
 */
export const useAdversaryAddition = ({
  entityGroups,
  pcCount,
  scrollContainerRef,
  createAdversariesBulk,
  createAdversary,
  setNewCards,
  setRecentlyAddedCards,
  getEntityGroups,
  smoothScrollTo,
  browserOpenAtPosition,
  columnWidth,
  sortBy,
  sortDir,
  groupBy,
  onAdversaryAdded
}) => {
  return useCallback(
    (itemData) => {
      const baseName = itemData.baseName || itemData.name?.replace(/\s+\(\d+\)$/, '') || itemData.name
      const existingGroup = entityGroups.find((g) => g.baseName === baseName && g.type === 'adversary')
      const isNewAdversary = !existingGroup

      const isMinion = itemData.type === 'Minion'
      const instancesToAdd = isMinion ? pcCount : 1

      const scrollWidthBeforeAdd = scrollContainerRef.current?.scrollWidth ?? 0
      const scrollLeftBeforeAdd = scrollContainerRef.current?.scrollLeft ?? 0

      const container = scrollContainerRef.current
      if (container && isNewAdversary) {
        const computedStyle = window.getComputedStyle(container)
        if (computedStyle.scrollSnapType !== 'none') {
          container.style.scrollSnapType = 'none'
        }
      }

      if (isMinion && instancesToAdd > 1) {
        const minionArray = Array(instancesToAdd)
          .fill(null)
          .map(() => ({ ...itemData }))
        createAdversariesBulk(minionArray)
      } else {
        createAdversary(itemData)
      }

      onAdversaryAdded?.(baseName)

      // Soft "just added" confirmation pulse — every add flashes the card that
      // now holds the new instance, whether it's a brand-new group or a
      // duplicate joining an existing one (#55). The value stored per key is
      // a pulse "token" (not just membership) so that adding a second
      // instance to a card that's already mid-pulse still restarts the CSS
      // animation — a Set (or any unchanged boolean-ish flag) would leave the
      // rendered className identical across the two adds, and CSS animations
      // don't replay just because a class was redundantly reapplied without
      // ever being removed in between (#55 round 3).
      const addedCardKey = `adversary-${baseName}`
      const pulseToken = Date.now()
      setRecentlyAddedCards?.((prev) => {
        const next = new Map(prev)
        next.set(addedCardKey, pulseToken)
        return next
      })
      setTimeout(() => {
        setRecentlyAddedCards?.((prev) => {
          // Only clear if this timeout's token is still the most recent one —
          // a later add on the same card already scheduled its own clear.
          if (prev.get(addedCardKey) !== pulseToken) return prev
          const next = new Map(prev)
          next.delete(addedCardKey)
          return next
        })
      }, RECENTLY_ADDED_DURATION_MS)

      if (isNewAdversary) {
        const cardKey = `adversary-${baseName}`
        setNewCards((prev) => new Set(prev).add(cardKey))
        setTimeout(() => {
          setNewCards((prev) => {
            const next = new Set(prev)
            next.delete(cardKey)
            return next
          })
        }, 10)
      }

      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!scrollContainerRef.current) return

            const container = scrollContainerRef.current
            if (container.scrollWidth <= container.clientWidth) {
              return
            }

            if (isNewAdversary) {
              const isDefaultOrder = groupBy === 'type' && sortBy === 'name' && sortDir === 'asc'
              if (isDefaultOrder) {
                const initialScrollWidth = container.scrollWidth
                setTimeout(() => {
                  if (!scrollContainerRef.current) return
                  const updatedContainer = scrollContainerRef.current

                  const maybeScroll = () => {
                    if (!scrollContainerRef.current) return
                    const finalContainer = scrollContainerRef.current
                    const maxScroll = finalContainer.scrollWidth - finalContainer.clientWidth
                    const distance = maxScroll - scrollLeftBeforeAdd
                    const scrollWidthIncreased = finalContainer.scrollWidth > scrollWidthBeforeAdd

                    if (scrollWidthIncreased && Math.abs(distance) < 1) {
                      smoothScrollTo(browserOpenAtPosition !== null ? maxScroll : maxScroll + 10, 500)
                    } else if (Math.abs(distance) > 1) {
                      smoothScrollTo(maxScroll, 500)
                    }
                  }

                  if (updatedContainer.scrollWidth !== initialScrollWidth) {
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        maybeScroll()
                      })
                    })
                  } else {
                    maybeScroll()
                  }
                }, 10)
              } else {
                // In grouped/sorted mode the new card lands at its sorted position, not the end.
                // Reuse the same visibility logic as the existing-group path.
                setTimeout(() => {
                  if (!scrollContainerRef.current) return
                  const container = scrollContainerRef.current
                  const cardKey = `adversary-${baseName}`
                  const targetScroll = getCardScrollTarget({
                    container,
                    cardKey,
                    columnWidth,
                    browserOpenAtPosition,
                  })
                  if (targetScroll !== null) {
                    smoothScrollTo(targetScroll, 500)
                  }
                }, 10)
              }
            } else {
              const container = scrollContainerRef.current
              const cardKey = `adversary-${baseName}`
              const targetScroll = getCardScrollTarget({
                container,
                cardKey,
                columnWidth,
                browserOpenAtPosition,
              })
              if (targetScroll !== null) {
                smoothScrollTo(targetScroll, 500)
              }
            }
          })
        })
      }, 50)
    },
    [
      browserOpenAtPosition,
      columnWidth,
      createAdversariesBulk,
      createAdversary,
      entityGroups,
      groupBy,
      onAdversaryAdded,
      pcCount,
      scrollContainerRef,
      setNewCards,
      setRecentlyAddedCards,
      smoothScrollTo,
      sortBy,
      sortDir
    ]
  )
}

