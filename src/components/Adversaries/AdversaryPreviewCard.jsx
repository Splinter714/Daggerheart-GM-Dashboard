import React from 'react'
import GameCard from './GameCard'

// Live preview used by the custom adversary creator: renders the adversary
// being created/edited as an actual dashboard card (same component used on
// the board), with a distinct "Type: PREVIEW" pill so it reads as a live
// preview rather than a real board entity. No boxed panel wrapper — the
// card just sits in the column like it would on the board.
export const AdversaryPreviewCard = ({ formItem, previewInstances }) => (
  <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <span style={{
      alignSelf: 'flex-start',
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
    }}>Type: PREVIEW</span>
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

export default AdversaryPreviewCard
