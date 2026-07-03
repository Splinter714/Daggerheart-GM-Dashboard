import { useCallback, useEffect, useRef } from 'react'
import { DASHBOARD_GAP } from '../constants'

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
  const getEntityGroupsRef = useRef(getEntityGroups)
  useEffect(() => { getEntityGroupsRef.current = getEntityGroups }, [getEntityGroups])

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
      // duplicate joining an existing one (#55).
      const addedCardKey = `adversary-${baseName}`
      setRecentlyAddedCards?.((prev) => new Set(prev).add(addedCardKey))
      setTimeout(() => {
        setRecentlyAddedCards?.((prev) => {
          const next = new Set(prev)
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
                  const updatedGroups = getEntityGroupsRef.current()
                  const groupIndex = updatedGroups.findIndex((g) => g.baseName === baseName && g.type === 'adversary')
                  if (groupIndex >= 0) {
                    const c = scrollContainerRef.current
                    const currentScroll = c.scrollLeft
                    const containerWidth = c.clientWidth
                    const effectiveWidth = browserOpenAtPosition !== null
                      ? containerWidth - columnWidth - DASHBOARD_GAP
                      : containerWidth
                    const cardPosition = DASHBOARD_GAP + groupIndex * (columnWidth + DASHBOARD_GAP)
                    const cardEnd = cardPosition + columnWidth
                    const margin = 10
                    const isVisible = cardPosition >= currentScroll - margin && cardEnd <= currentScroll + effectiveWidth + margin
                    if (!isVisible) {
                      let targetScroll
                      if (cardEnd > currentScroll + effectiveWidth + margin) {
                        const visibleColumns = Math.round((containerWidth - DASHBOARD_GAP) / (columnWidth + DASHBOARD_GAP))
                        const lastVisibleSlot = browserOpenAtPosition !== null ? visibleColumns - 2 : visibleColumns - 1
                        targetScroll = (groupIndex - lastVisibleSlot) * (columnWidth + DASHBOARD_GAP)
                      } else {
                        targetScroll = groupIndex * (columnWidth + DASHBOARD_GAP)
                      }
                      smoothScrollTo(Math.max(0, targetScroll), 500)
                    }
                  }
                }, 10)
              }
            } else {
              const updatedGroups = getEntityGroupsRef.current()
              const groupIndex = updatedGroups.findIndex((g) => g.baseName === baseName && g.type === 'adversary')
              if (groupIndex >= 0) {
                const container = scrollContainerRef.current
                const currentScroll = container.scrollLeft
                const containerWidth = container.clientWidth
                // When browser is open, the last column is covered — reduce visible area
                const effectiveWidth = browserOpenAtPosition !== null
                  ? containerWidth - columnWidth - DASHBOARD_GAP
                  : containerWidth

                // Account for left padding: DASHBOARD_GAP + groupIndex * (columnWidth + DASHBOARD_GAP)
                const cardPosition = DASHBOARD_GAP + groupIndex * (columnWidth + DASHBOARD_GAP)
                const cardEnd = cardPosition + columnWidth
                const margin = 10
                const isVisible = cardPosition >= currentScroll - margin && cardEnd <= currentScroll + effectiveWidth + margin

                if (!isVisible) {
                  let targetScroll
                  if (cardEnd > currentScroll + effectiveWidth + margin) {
                    // Card is hidden on the right — snap-aligned target placing card in last visible slot
                    const visibleColumns = Math.round((containerWidth - DASHBOARD_GAP) / (columnWidth + DASHBOARD_GAP))
                    const lastVisibleSlot = browserOpenAtPosition !== null ? visibleColumns - 2 : visibleColumns - 1
                    targetScroll = (groupIndex - lastVisibleSlot) * (columnWidth + DASHBOARD_GAP)
                  } else {
                    // Card is hidden on the left — snap-aligned left edge
                    targetScroll = groupIndex * (columnWidth + DASHBOARD_GAP)
                  }
                  smoothScrollTo(Math.max(0, targetScroll), 500)
                }
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

