import React from 'react'
import { CARD_SPACE_H, CARD_SPACE_V } from './constants'
import { highlightCardText } from './textHighlighter'
import SectionHeader from './SectionHeader'

// Section divider used within the environment card's expanded view (features
// groups + potential adversaries). Now a re-export of the single shared
// SectionHeader (see SectionHeader.jsx) used by adversary, environment, and
// colossus cards alike — per Jackson's playtest feedback (#100, #109) that
// these had drifted out of visual sync across card types.
export const FeatureDivider = SectionHeader

// Impulses blurb — styled like adversary cards' motives quote-block for consistency (#100)
export const EnvironmentImpulses = ({ impulses }) => {
  if (!impulses) return null
  return (
    <div style={{ padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.4,
        textAlign: 'center', textWrap: 'balance',
        borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
        padding: `0 ${CARD_SPACE_H}`,
      }}>
        {impulses}
      </div>
    </div>
  )
}

export const EnvironmentFeatureGroup = ({ env, featureType, label }) => {
  const features = (env.features || []).filter(f => f.type === featureType)
  if (!features.length) return null
  return (
    <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H, marginTop: CARD_SPACE_V }}>
      <FeatureDivider title={label} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V, marginTop: CARD_SPACE_V }}>
        {features.map((f, i) => (
          <div key={i}>
            <span style={{ fontWeight: 400, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{f.name}</span>
            {f.description && (
              <div style={{ fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-secondary)', marginLeft: CARD_SPACE_H, marginTop: '0.125rem' }}>
                {highlightCardText(f.description)}
              </div>
            )}
            {f.details && f.details.length > 0 && (
              <ul style={{ margin: '4px 0 0', paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {f.details.map((d, di) => <li key={di}>{d}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Potential Adversaries — short names as wrapped tags, not bare stacked lines (#103)
export const PotentialAdversaries = ({ names }) => {
  if (!names || !names.length) return null
  return (
    <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H, paddingBottom: CARD_SPACE_V, marginTop: CARD_SPACE_V }}>
      <FeatureDivider title="Potential Adversaries" />
      <div style={{ marginTop: CARD_SPACE_V, display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {names.map((adv, i) => (
          <span key={i} style={{
            fontSize: '0.75rem', color: 'var(--text-primary)', border: '1px solid var(--border)',
            borderRadius: '0.25rem', padding: '0.15rem 0.5rem', backgroundColor: 'var(--bg-card)',
          }}>
            {adv}
          </span>
        ))}
      </div>
    </div>
  )
}
