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

  // Hidden-right (card sits past the visible viewport, so we're scrolling
  // right to reveal it): land the card at the *rightmost* visible position
  // instead of the leftmost (#121 — Jackson felt landing it leftmost, with
  // a wall of newly-revealed cards to its right, felt less natural than
  // seeing it arrive at the trailing edge). The container's
  // scroll-padding-right equals DASHBOARD_GAP (see DashboardView.css), so
  // aligning the card's trailing edge to `effectiveWidth - DASHBOARD_GAP`
  // lands on that same scroll-padding boundary the browser already respects,
  // avoiding the corrective post-hoc snap lurch #50 originally fixed.
  //
  // Hidden-left (card sits before the current scroll position) keeps the
  // original leading-edge alignment — `cardPosition - DASHBOARD_GAP` is a
  // valid snap point (every column has scroll-snap-align: 'start'), and
  // landing a leftward reveal at its leading edge is still the natural
  // "scroll left until you see it appear at the left" behavior Jackson
  // hasn't asked to change.
  const isHiddenRight = cardEnd > currentScroll + effectiveWidth + margin
  const targetScroll = isHiddenRight
    ? cardEnd - effectiveWidth + DASHBOARD_GAP
    : cardPosition - DASHBOARD_GAP

  return Math.max(0, targetScroll)
}
