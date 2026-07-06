import React, { useCallback, useState } from 'react'
import { DASHBOARD_GAP } from './constants'

// Shared "group pill + rail" treatment: an inset top-tab label (e.g. a group
// name like "LEADER", or "TYPE: PREVIEW" for the adversary creator's live
// preview) with a bracket border that sits at the pill's vertical midpoint,
// merging into the top of whatever renders below it (a card or cards row).
//
// The pill height is measured on first render so the rail height/offset are
// derived from the actual rendered pill rather than a guessed constant — the
// rail sits exactly at the pill's midpoint and the hook drop is exactly half
// the pill height. Both real dashboard group sections (EntityColumns) and the
// custom adversary creator's live preview (AdversaryPreviewCard) use this same
// component so the two always render identically (#56).
export const GROUP_TAB_TOP_SPACE = DASHBOARD_GAP // px above pill top

export const GroupTabBar = ({ label, sticky = false, railTestId = 'group-rail-border' }) => {
  const [pillHeight, setPillHeight] = useState(22) // updated on first render
  const pillMeasureRef = useCallback(node => {
    if (node) {
      const h = node.getBoundingClientRect().height
      if (h > 0) setPillHeight(h)
    }
  }, [])
  const tabBarHeight = Math.round(GROUP_TAB_TOP_SPACE + pillHeight)
  const lineY = Math.round(GROUP_TAB_TOP_SPACE + pillHeight * 0.35)
  const railPosition = sticky ? 'sticky' : 'absolute'

  return (
    <div style={{ height: tabBarHeight, position: 'relative' }}>
      {/* Sticky (not absolute) with an explicit width so its left edge tracks
          the pinned pill instead of the wrapper's scrolled-away edge —
          absolute + left:0/right:0 let the top border draw past the pill
          once scrolled (#86). Needs a non-flex parent for the 100% width to
          resolve against the wrapper. Height extends past the tab bar itself
          so the rail overlaps/merges into the card row rendered below (#56):
          without that overlap the pill floats above the card with a gap. */}
      <div data-testid={railTestId} style={{
        position: railPosition, top: lineY, left: 0, width: '100%',
        height: `calc(100% - ${lineY}px - 6px)`,
        borderTop: '1px solid var(--text-secondary)',
        borderLeft: '1px solid var(--text-secondary)',
        borderRight: '1px solid var(--text-secondary)',
        borderTopRightRadius: 4, pointerEvents: 'none', boxSizing: 'border-box', zIndex: 1,
      }} />
      <span
        ref={pillMeasureRef}
        style={{
          position: railPosition,
          left: 0,
          display: 'inline-block',
          zIndex: 1,
          marginTop: GROUP_TAB_TOP_SPACE,
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'white',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          background: 'var(--bg-card)',
          border: '2px solid var(--border)',
          borderRadius: '6px',
          padding: '3px 9px',
        }}
      >
        {label}
      </span>
    </div>
  )
}

export default GroupTabBar
