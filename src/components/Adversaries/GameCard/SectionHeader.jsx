import React from 'react'
import { CARD_SPACE_H } from './constants'

// Single shared section-header divider used for ALL "PASSIVES / ACTIONS /
// REACTIONS" (and similar, e.g. "Segments", "Standard Attack", "Potential
// Adversaries") labels across every card type — adversary (FeaturesSection),
// environment (EnvironmentFeaturesSection), and colossus (both nested
// NestedSegmentBlock/FeatureList and standalone ColossusSegmentCard/
// ColossusFrameworkInfo). Before #100/#109's consolidation these were three
// separately-maintained copies that drifted out of visual sync (adversary
// used text-primary, colossus used text-secondary). This is now the single
// source of truth — update styling here only.
export const SectionHeader = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H }}>
    <hr
      style={{
        flex: 1,
        border: 'none',
        borderTop: '1px solid var(--border)',
        margin: 0,
      }}
    />
    <h4
      style={{
        margin: 0,
        fontSize: '0.75rem',
        fontWeight: 400,
        color: 'var(--text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {title}
    </h4>
  </div>
)

export default SectionHeader
