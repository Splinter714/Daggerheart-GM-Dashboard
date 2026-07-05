// Shared style objects, type constants, and pure helpers for the custom adversary creator.
// Extracted verbatim from CustomAdversaryCreator.jsx (Phase 4) — no React, no closures.
// ─── Shared style helpers ───────────────────────────────────────────────────

export const inputStyle = {
  width: '100%',
  padding: '0.4rem 0.6rem',
  border: '1px solid var(--border)',
  borderRadius: '0.25rem',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle = {
  // #123: reduced from 0.75rem/0.5px letter-spacing — narrow two-column
  // stat fields (e.g. "ATTACK MODIFIER", "MAJOR THRESHOLD") were wrapping
  // onto multiple lines too readily at the old size.
  fontSize: '0.68rem',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  marginBottom: '0.3rem',
  display: 'block',
}

// #123: label style variant for fields whose label doubles as an
// InfoPopover trigger (dashed-underline on the label text itself, replacing
// the old separate circular "i" icon button). `color` and `marginBottom`
// are left to the InfoPopover trigger button / wrapping row instead of the
// label span, so the button's open/hover purple can show through.
export const popoverLabelStyle = {
  ...labelStyle,
  color: 'inherit',
  marginBottom: 0,
}

export const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
}

// Compact 22px square control button (reorder/delete), matching quick-edit
// mode's ReorderControls style (src/components/Adversaries/GameCard/ReorderControls.jsx).
export const compactCtrlBtnStyle = (disabled) => ({
  width: '22px',
  height: '22px',
  padding: 0,
  border: '1px solid var(--border)',
  borderRadius: '3px',
  backgroundColor: 'var(--gray-700)',
  color: disabled ? 'var(--text-secondary)' : 'white',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  fontWeight: '600',
  fontSize: '12px',
  lineHeight: '1',
  transition: 'background-color 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

export const TYPES = ['Standard', 'Bruiser', 'Horde', 'Leader', 'Minion', 'Ranged', 'Skulk', 'Solo', 'Support', 'Social', 'Colossus']
export const DAMAGE_TYPES = ['Physical', 'Magical', 'Physical/Magical']
const TYPE_SHORT = { Physical: 'phy', Magical: 'mag', 'Physical/Magical': 'phy/mag' }
const TYPE_FROM_SHORT = { phy: 'Physical', mag: 'Magical', 'phy/mag': 'Physical/Magical', 'mag/phy': 'Physical/Magical' }
export const parseDamage = (str) => {
  if (!str) return { dice: '', type: '' }
  const m = str.trim().match(/^(.*?)\s+(phy(?:\/mag)?|mag(?:\/phy)?)$/i)
  if (m) return { dice: m[1].trim(), type: TYPE_FROM_SHORT[m[2].toLowerCase()] || '' }
  return { dice: str.trim(), type: '' }
}
export const buildDamage = (dice, type) => {
  const short = TYPE_SHORT[type]
  return short ? `${dice} ${short}`.trim() : (dice || '')
}

// ─── Module-level helpers (MUST stay outside the component to avoid remounting on every render) ───

export const reorder = (arr, from, to) => {
  if (from === to) return arr
  const r = [...arr]
  const [item] = r.splice(from, 1)
  r.splice(to, 0, item)
  return r
}
