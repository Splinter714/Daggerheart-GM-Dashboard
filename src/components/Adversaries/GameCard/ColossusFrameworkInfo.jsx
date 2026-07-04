import React from 'react'
import { CARD_SPACE_H, CARD_SPACE_V } from './constants'

// Framework-level info shared by every segment of a colossus — Thresholds,
// Motives & Tactics, Experience, and Stress. Jackson confirmed (#109) this
// should repeat on EVERY segment card (both nested and standalone) rather
// than living on a separate framework/summary card, so each segment card is
// fully self-contained. Stress stays a single shared value/pip row — all
// segment cards read/write the same `inst.stress` field, so toggling a pip
// on one card is reflected on every other segment card for the same colossus.
//
// Rendered as plain text (not MergedStatBadge) — that badge's fixed-width
// pill is sized for short DIFF/ATK values and overflows a Major/Severe pair.
export const ColossusThresholdsBadge = ({ colossus }) => (
  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
    Major {colossus.thresholds?.major ?? '-'} / Severe {colossus.thresholds?.severe ?? '-'}
  </span>
)

export const ColossusMotives = ({ colossus }) => {
  if (!colossus.motivesAndTactics?.trim()) return null
  return (
    <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Motives &amp; Tactics </span>
      {colossus.motivesAndTactics}
    </div>
  )
}

export const ColossusExperience = ({ colossus }) => {
  if (!colossus.experience?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
      {colossus.experience.map((e, i) => (
        <span key={i} style={{
          fontSize: '0.75rem', color: 'var(--text-secondary)',
          border: '1px solid var(--border)', borderRadius: '0.1875rem', padding: '1px 6px',
        }}>
          {e.name} {e.modifier >= 0 ? `+${e.modifier}` : e.modifier}
        </span>
      ))}
    </div>
  )
}

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

// Full framework-info block for a segment card: Motives/Experience row, then
// Stress. Thresholds is rendered inline alongside Difficulty by the caller
// (mirrors the regular adversary card's Difficulty | Thresholds convention),
// so it isn't included here.
const ColossusFrameworkInfo = ({ colossus, inst, onUpdate }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
    {(colossus.motivesAndTactics?.trim() || colossus.experience?.length > 0) && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
        <ColossusMotives colossus={colossus} />
        <ColossusExperience colossus={colossus} />
      </div>
    )}
    <ColossusStress colossus={colossus} inst={inst} onUpdate={onUpdate} />
  </div>
)

export default ColossusFrameworkInfo
