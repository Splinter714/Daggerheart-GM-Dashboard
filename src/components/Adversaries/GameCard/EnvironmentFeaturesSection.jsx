import React from 'react'
import { CARD_SPACE_H, CARD_SPACE_V } from './constants'
import { highlightCardText } from './textHighlighter'

// Section divider used within the environment card's expanded view
// (features groups + potential adversaries). Styled to exactly match the
// adversary card's FeatureDivider (GameCard/FeaturesSection.jsx) — same
// text-primary color, same "no baked-in marginTop" convention (callers add
// their own spacing above the category, matching adversary cards) — per
// Jackson's playtest feedback (#100) that these looked inconsistent.
export const FeatureDivider = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H }}>
    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
    <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {title}
    </h4>
  </div>
)

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
