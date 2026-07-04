import { DASHBOARD_GAP } from '../constants'

/**
 * Resolves the horizontal scroll target needed to bring a card into view,
 * based on the card's *actual rendered position* in the DOM rather than a
 * flat-index calculation.
 *
 * Grouping (#106: always on) inserts extra structure — group-section
 * wrappers, header pills, double gaps between adjacent group sections —
 * that a flat `index * (columnWidth + gap)` formula can't account for.
 * Measuring the real element sidesteps all of that: it's correct whether
 * the card sits in a solo column or nested inside a grouped section.
 *
 * Returns `null` if the card is already visible (no scroll needed) or the
 * card element can't be found.
 */
export function getCardScrollTarget({
  container,
  cardKey,
  columnWidth,
  browserOpenAtPosition = null,
  margin = 10,
}) {
  if (!container || !cardKey) return null

  const cardEl = container.querySelector(`[data-card-key="${cardKey}"]`)
  if (!cardEl) return null

  const currentScroll = container.scrollLeft
  const containerWidth = container.clientWidth
  const effectiveWidth = browserOpenAtPosition !== null
    ? containerWidth - columnWidth - DASHBOARD_GAP
    : containerWidth

  // offsetLeft is relative to offsetParent; the scroll container is a flex
  // row with the group wrappers/panels as direct/nested children, so using
  // getBoundingClientRect against the container's own rect is robust
  // regardless of nesting depth (solo column vs. inside a group wrapper).
  const containerRect = container.getBoundingClientRect()
  const cardRect = cardEl.getBoundingClientRect()
  const cardPosition = (cardRect.left - containerRect.left) + currentScroll
  const cardEnd = cardPosition + cardRect.width

  const isVisible = cardPosition >= currentScroll - margin &&
    cardEnd <= currentScroll + effectiveWidth + margin

  if (isVisible) return null

  let targetScroll
  if (cardEnd > currentScroll + effectiveWidth + margin) {
    // Hidden on the right — bring its trailing edge into the visible area.
    targetScroll = currentScroll + (cardEnd - (currentScroll + effectiveWidth))
  } else {
    // Hidden on the left — align its leading edge.
    targetScroll = cardPosition - DASHBOARD_GAP
  }

  return Math.max(0, targetScroll)
}
