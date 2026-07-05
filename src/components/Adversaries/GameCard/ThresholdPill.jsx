import React from 'react'

// Shared threshold pill — the black, bordered "Minor | 7 | Major | 14 |
// Severe" (or "Major 11 / Severe 22" for colossi, which have no Minor step)
// row used by the regular adversary card (StatusSection.jsx) and now also by
// colossus cards (ColossusFrameworkInfo.jsx, both nested and segment-card
// display modes). Extracted per #109's playtest feedback: colossus cards
// previously reimplemented this as plain text instead of reusing the actual
// adversary-card component/styles.

const ThresholdSep = () => (
  <span style={{ display: 'inline-block', width: '1px', height: '1em', backgroundColor: 'var(--text-secondary)', flexShrink: 0 }} />
)

const ThresholdLabel = ({ text }) => (
  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 400 }}>{text}</span>
)

const ThresholdTag = ({ value }) => (
  <>
    <ThresholdSep />
    <span style={{ color: 'white' }}>{value}</span>
    <ThresholdSep />
  </>
)

// `minor` is optional — colossi only track Major/Severe, adversaries track
// Minor (implicit "1")/Major/Severe.
export const ThresholdPill = ({ major, severe, flex = true }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.35rem',
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1,
      backgroundColor: 'black',
      border: '1px solid var(--text-secondary)',
      borderRadius: '0.25rem',
      padding: '0 0.4rem',
      height: '1.375rem',
      flex: flex ? 1 : undefined,
      flexShrink: flex ? undefined : 0,
    }}
  >
    <ThresholdLabel text="Minor" />
    <ThresholdTag value={major ?? 7} />
    <ThresholdLabel text="Major" />
    <ThresholdTag value={severe ?? 14} />
    <ThresholdLabel text="Severe" />
  </div>
)

export { ThresholdLabel, ThresholdSep, ThresholdTag }
export default ThresholdPill
