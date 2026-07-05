import React, { useCallback, useState } from 'react'
import GameCard from './GameCard'
import { DASHBOARD_GAP } from '../Dashboard/constants'

// Live preview used by the custom adversary creator: renders the adversary
// being created/edited as an actual dashboard card (same component used on
// the board), with a "Type: PREVIEW" pill so it reads as a live preview
// rather than a real board entity. No boxed panel wrapper — the card just
// sits in the column like it would on the board.
//
// The pill mirrors EntityColumns' group-pill treatment (#56: it previously
// used a bespoke floating pill with no "rail") — same pill styling, plus the
// same top/left/right bracket border sitting at the pill's vertical midpoint,
// so a preview card reads consistently with a normal grouped column instead
// of looking like a one-off.
const GROUP_TAB_TOP_SPACE = DASHBOARD_GAP

export const AdversaryPreviewCard = ({ formItem, previewInstances }) => {
  const [pillHeight, setPillHeight] = useState(22)
  const pillMeasureRef = useCallback(node => {
    if (node) {
      const h = node.getBoundingClientRect().height
      if (h > 0) setPillHeight(h)
    }
  }, [])
  const tabBarHeight = Math.round(GROUP_TAB_TOP_SPACE + pillHeight)
  const lineY = Math.round(GROUP_TAB_TOP_SPACE + pillHeight * 0.35)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: tabBarHeight, position: 'relative' }}>
        <div data-testid="preview-rail-border" style={{
          position: 'absolute', top: lineY, left: 0, right: 0, bottom: 0,
          borderTop: '1px solid var(--text-secondary)',
          borderLeft: '1px solid var(--text-secondary)',
          borderRight: '1px solid var(--text-secondary)',
          borderTopRightRadius: 4, pointerEvents: 'none',
        }} />
        <span
          ref={pillMeasureRef}
          style={{
            position: 'relative',
            display: 'inline-block',
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
        >Type: PREVIEW</span>
      </div>
      <GameCard
        item={formItem}
        type="adversary"
        mode="expanded"
        instances={previewInstances}
        showAddRemoveButtons={false}
        onUpdate={() => {}}
      />
    </div>
  )
}

export default AdversaryPreviewCard
