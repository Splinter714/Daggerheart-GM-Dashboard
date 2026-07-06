import React from 'react'
import GameCard from './GameCard'
import { GroupTabBar } from '../Dashboard/GroupTabBar'

// Live preview used by the custom adversary creator: renders the adversary
// being created/edited as an actual dashboard card (same component used on
// the board), with a "Type: PREVIEW" pill so it reads as a live preview
// rather than a real board entity. No boxed panel wrapper — the card just
// sits in the column like it would on the board.
//
// The pill reuses EntityColumns' shared GroupTabBar component (#56: it
// previously used a bespoke floating pill with no "rail", which didn't merge
// into the card's top border like a normal group pill) — same component, so
// a preview card always renders identically to a normal grouped column
// instead of drifting into a one-off.
export const AdversaryPreviewCard = ({ formItem, previewInstances }) => {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
      <GroupTabBar label="Type: PREVIEW" railTestId="preview-rail-border" />
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
