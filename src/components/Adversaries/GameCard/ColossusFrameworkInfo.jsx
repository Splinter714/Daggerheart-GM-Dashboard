import React from 'react'
import { CARD_SPACE_H } from './constants'
import ThresholdPill from './ThresholdPill'
import MotivesExperienceRow from './MotivesExperience'

// Framework-level info shared by every segment of a colossus — Thresholds,
// Motives & Tactics, Experience, and Stress. Jackson confirmed (#109) this
// should repeat on EVERY segment card (both nested and standalone) rather
// than living on a separate framework/summary card, so each segment card is
// fully self-contained. Stress stays a single shared value/pip row — all
// segment cards read/write the same `inst.stress` field, so toggling a pip
// on one card is reflected on every other segment card for the same colossus.
//
// Per #109's round-2 playtest feedback ("re-use the actual adversary-card
// threshold pill, motives display, and experience display"), these now
// render via the exact same shared components/styles as the regular
// adversary card (ThresholdPill, MotivesExperienceRow) instead of bespoke
// plain-text renderings that had visually drifted from the adversary card.
export const ColossusThresholdsBadge = ({ colossus }) => (
  <ThresholdPill major={colossus.thresholds?.major} severe={colossus.thresholds?.severe} flex={false} />
)

// Shared Stress pip row — reads/writes `inst.stress` directly (the same
// framework-level field the nested colossus card already used), so toggling
// a pip on any segment card stays in sync across all of them.
export const ColossusStress = ({ colossus, inst, onUpdate }) => {
  const max = colossus.colossusStressMax
  if (!max) return null
  const marked = inst?.stress || 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>Stress</span>
      <div style={{ display: 'flex', gap: '0.1875rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            onClick={e => {
              e.stopPropagation()
              if (!inst || !onUpdate) return
              onUpdate(inst.id, { stress: i < marked ? i : i + 1 })
            }}
            style={{
              position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '44px', height: '44px', margin: '-0.6875rem', flexShrink: 0,
              cursor: onUpdate && inst ? 'pointer' : 'default',
            }}
          >
            <div style={{
              width: '0.75rem', height: '0.75rem', borderRadius: '50%',
              border: '1.5px solid var(--text-secondary)',
              backgroundColor: i < marked ? 'var(--text-primary)' : 'transparent',
            }} />
          </span>
        ))}
      </div>
    </div>
  )
}

// Motives + Experience row — framework-shared, rendered as its own row
// (row 3 of the adversary-card-mirroring layout, #109) above the
// instance-style mini-cards. Thresholds/Stress are rendered elsewhere by the
// caller (Thresholds inline with Difficulty in row 2; Stress inside each
// instance mini-card via ColossusStressAdjuster). Now backed by the same
// MotivesExperienceRow component the regular adversary card uses (#109).
const ColossusFrameworkInfo = ({ colossus }) => (
  <MotivesExperienceRow motives={colossus.motivesAndTactics} experience={colossus.experience} />
)

export default ColossusFrameworkInfo
