import React from 'react'
import { CARD_SPACE_H } from './constants'

// Shared Motives + Experience row — the borderLeft/borderRight quote-block +
// black bordered tag-pill treatment used by the regular adversary card
// (StatusSection.jsx). Extracted per #109's playtest feedback so colossus
// cards (ColossusFrameworkInfo.jsx, both nested and segment-card display
// modes) render motives/experience with the exact same component/styles
// instead of a bespoke, visually-similar copy.
export const ExperienceTags = ({ experience }) => {
  if (!experience?.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
      {experience.map((exp, index) => {
        let label
        if (typeof exp === 'string') {
          label = exp
        } else {
          const mod = typeof exp.modifier === 'number'
            ? (exp.modifier >= 0 ? `+${exp.modifier}` : `${exp.modifier}`)
            : exp.modifier
          label = mod != null ? `${exp.name} ${mod}` : exp.name
        }
        return (
          <span key={index} style={{
            display: 'inline-flex', alignItems: 'center',
            fontSize: '0.66rem', fontWeight: 400, color: 'white', whiteSpace: 'nowrap',
            backgroundColor: 'black', border: '1px solid var(--text-secondary)',
            borderRadius: '0.1875rem', height: '0.95rem', padding: '0 0.3rem',
          }}>
            {label}
          </span>
        )
      })}
    </div>
  )
}

// Motives + Experience row — motive slot keeps its left line even when
// empty (as long as the row shows); centered when there are no experiences,
// left-aligned (quote block) when there are.
export const MotivesExperienceRow = ({ motives, experience }) => {
  if (!motives?.trim() && !experience?.length) return null
  return (
    <div style={{ display: 'flex', gap: CARD_SPACE_H, alignItems: 'stretch' }}>
      <div style={{
        flex: 1,
        fontSize: '0.66rem', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.4,
        textAlign: experience?.length > 0 ? 'left' : 'center', textWrap: 'balance',
        borderLeft: '1px solid var(--border)',
        paddingLeft: CARD_SPACE_H,
        display: 'flex', alignItems: 'center',
        justifyContent: experience?.length > 0 ? 'flex-start' : 'center',
      }}>
        {motives?.trim() ? motives + (!motives.endsWith('.') ? '.' : '') : ''}
      </div>
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        borderRight: '1px solid var(--border)',
        paddingRight: CARD_SPACE_H,
      }}>
        <ExperienceTags experience={experience} />
      </div>
    </div>
  )
}

export default MotivesExperienceRow
