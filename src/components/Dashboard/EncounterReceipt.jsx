import React from 'react'
import { Plus, Minus, X, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Check } from 'lucide-react'
import { BATTLE_POINT_ADJUSTMENTS, BATTLE_POINT_COSTS } from './BattlePointsCalculator'
import { TYPE_ORDER } from './constants'
import { useState } from 'react'

const actionBtn = (danger) => ({
  background: danger ? 'var(--danger)' : 'var(--bg-secondary)',
  border: danger ? 'none' : '1px solid var(--border)',
  color: danger ? 'white' : 'var(--text-primary)',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  padding: '8px',
  boxSizing: 'content-box',
  flexShrink: 0,
})

const itemRowStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.25rem 0',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
  gap: '0.4rem',
}

const MANUAL_ADJUSTMENTS = [
  {
    key: 'lessDifficult',
    label: 'Less Difficult',
    value: BATTLE_POINT_ADJUSTMENTS.lessDifficult,
  },
  {
    key: 'increasedDamage',
    label: 'Increased Damage',
    value: BATTLE_POINT_ADJUSTMENTS.increasedDamage,
  },
  {
    key: 'moreDangerous',
    label: 'More Dangerous',
    value: BATTLE_POINT_ADJUSTMENTS.moreDangerous,
  },
]


const SORT_OPTIONS = [
  { value: 'name',       label: 'Name'      },
  { value: 'tier',       label: 'Tier'      },
  { value: 'hp',         label: 'HP'        },
  { value: 'difficulty', label: 'Difficulty'},
  { value: 'atk',        label: 'Attack'    },
  { value: 'threshold',  label: 'Threshold' },
]

const rowBpCost = (item, quantity, pcCount) => {
  const cost = BATTLE_POINT_COSTS[item.type] || 2
  if (item.type === 'Minion') return Math.ceil(quantity / pcCount) * cost
  return cost * quantity
}

const sortItems = (items, sortBy, sortDir) => {
  if (!sortBy || sortBy === 'none') return items
  return [...items].sort((a, b) => {
    const ai = a.item, bi = b.item
    let va, vb
    switch (sortBy) {
      case 'name':       va = ai.name || ''; vb = bi.name || ''; break
      case 'tier':       va = ai.tier || 0;  vb = bi.tier || 0;  break
      case 'hp':         va = ai.hpMax || 0; vb = bi.hpMax || 0; break
      case 'difficulty': va = ai.difficulty || 0; vb = bi.difficulty || 0; break
      case 'atk':        va = ai.atk || 0;   vb = bi.atk || 0;   break
      case 'threshold':  va = ai.thresholds?.major || 0; vb = bi.thresholds?.major || 0; break
      default: return 0
    }
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return sortDir === 'asc' ? va - vb : vb - va
  })
}

const groupByType = (items, sortBy, sortDir) => {
  const map = {}
  items.forEach(item => {
    const key = item.item.type || 'Unknown'
    if (!map[key]) map[key] = []
    map[key].push(item)
  })
  const keys = Object.keys(map).sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a)
    const bi = TYPE_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
  return keys.map(key => ({ key, items: sortItems(map[key], sortBy, sortDir) }))
}

const sectionLabel = {
  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.35rem',
}

const optRow = (selected) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: '0.4rem', padding: '0.2rem 0.4rem', borderRadius: '5px', cursor: 'pointer',
  background: selected ? 'color-mix(in srgb, var(--purple) 12%, transparent)' : 'transparent',
  color: selected ? 'var(--purple)' : 'var(--text-primary)',
  fontSize: '0.8rem', userSelect: 'none',
})

const dot = (selected) => ({
  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
  border: `2px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
  backgroundColor: selected ? 'var(--purple)' : 'transparent',
  transition: 'background 0.1s, border-color 0.1s',
})

// Custom styled checkbox matching app aesthetic
const AppCheckbox = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
      border: `2px solid ${checked ? 'var(--purple)' : 'var(--border)'}`,
      backgroundColor: checked ? 'var(--purple)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.1s, border-color 0.1s',
    }}
  >
    {checked && <Check size={10} strokeWidth={3} color="white" />}
  </div>
)

const formatModifier = (value) => value > 0 ? `+${value} BP` : `${value} BP`

// Small badge marking a row as auto-detected/read-only, distinct from the
// clickable manual-adjustment rows above it (#78).
const AutoTag = () => (
  <span style={{
    fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
    color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px',
    padding: '0.05rem 0.3rem', flexShrink: 0,
  }}>
    auto
  </span>
)

const autoRowStyle = {
  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.3rem',
  userSelect: 'none', borderRadius: '5px',
  background: 'color-mix(in srgb, var(--text-secondary) 6%, transparent)',
}

const EncounterReceipt = ({
  encounterItems,
  pcCount,
  onChangePcCount,
  onAdd,
  onRemove,
  bpAdjustments = {},
  onChangeBpAdjustments,
  availableBattlePoints,
  spentBattlePoints,
  sortBy = 'name',
  sortDir = 'asc',
  onSortBy,
}) => {
  const [sortOpen, setSortOpen] = useState(false)

  const adversaryItems = encounterItems.filter(i => i.type === 'adversary')
  const groups = groupByType(adversaryItems, sortBy, sortDir)

  // Compute auto adjustments
  const soloCount = adversaryItems
    .filter(i => i.item.type === 'Solo' && i.quantity > 0)
    .reduce((sum, i) => sum + i.quantity, 0)
  const twoOrMoreSolos = soloCount >= 2

  const hasMajorThreats = adversaryItems.some(i =>
    ['Bruiser', 'Horde', 'Leader', 'Solo'].includes(i.item.type) && i.quantity > 0
  )
  // Active whenever there are no major threats present — including an empty board,
  // not just a board with only non-major adversaries (#78).
  const noMajorThreats = !hasMajorThreats

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Name'
  const baseBP = (3 * pcCount) + 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Sort — pinned at top */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', padding: '0 1rem' }}>
        <button
          type="button"
          onClick={() => setSortOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '0.4rem 0', color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Sort within group
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.72rem' }}>
              {currentSortLabel} {sortDir === 'asc' ? '↑' : '↓'}
            </span>
          </span>
          {sortOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {sortOpen && (
          <div style={{ paddingBottom: '0.6rem' }}>
            <div style={sectionLabel}>Sort by</div>
            {SORT_OPTIONS.map(({ value, label }) => {
              const sel = sortBy === value
              return (
                <div key={value} style={optRow(sel)} onClick={() => onSortBy(value)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={dot(sel)} />{label}
                  </div>
                  {sel && (sortDir === 'asc'
                    ? <ArrowUp size={11} strokeWidth={2.5} />
                    : <ArrowDown size={11} strokeWidth={2.5} />)}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Scrollable: adversary rows + adjustments + party size */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 1rem' }}>

        {/* Adversary rows grouped by type */}
        {groups.map(({ key, items }) => {
          const isColossus = key === 'Colossus'
          const isMinion = key === 'Minion'
          const cost = BATTLE_POINT_COSTS[key]
          return (
            <React.Fragment key={key}>
              <div style={{ padding: '0.3rem 0 0.1rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  {key}
                </span>
                {isColossus ? (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 400, fontStyle: 'italic' }}>
                    (not BP-costed)
                  </span>
                ) : cost != null && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                    ({cost} BP each)
                  </span>
                )}
              </div>
              {items.map((encounterItem) => {
                const isZero = encounterItem.quantity === 0
                // Minion rows use the "{group count} {name} ({instances per group}) = {total instances}"
                // format, e.g. 2 groups of Giant Rat with 3 instances each renders as
                // "2 Giant Rat (3) = 6" (#87).
                const totalInstances = isMinion ? (encounterItem.instanceCount ?? encounterItem.quantity) : null
                const perGroupInstances = isMinion && encounterItem.quantity > 0
                  ? Math.round(totalInstances / encounterItem.quantity)
                  : null
                return (
                  <div key={`${encounterItem.item.id}-${encounterItem.type}`} className="receipt-item" style={itemRowStyle}>
                    <button onClick={() => onRemove(encounterItem.item.id, encounterItem.type)} style={actionBtn(isColossus || isZero)}>
                      {isColossus || isZero ? <X size={13} /> : <Minus size={13} />}
                    </button>
                    {!isColossus && !isMinion && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: '1rem', textAlign: 'center', flexShrink: 0 }}>
                        {encounterItem.quantity}
                      </span>
                    )}
                    {isMinion ? (
                      <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {encounterItem.quantity} {encounterItem.item.name || encounterItem.item.baseName}
                        {perGroupInstances != null && ` (${perGroupInstances})`}
                        {' = '}{totalInstances}
                      </span>
                    ) : (
                      <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {encounterItem.item.name || encounterItem.item.baseName}
                      </span>
                    )}
                    {!isColossus && (
                      <button onClick={() => onAdd(encounterItem.item, encounterItem.type)} style={actionBtn(false)}>
                        <Plus size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          )
        })}

        {/* Adjustments + Party Size */}
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          <div style={sectionLabel}>Adjustments</div>

          {/* Manual adjustment rows */}
          {onChangeBpAdjustments && MANUAL_ADJUSTMENTS.map(({ key, label, value }) => {
            const checked = !!bpAdjustments[key]
            return (
              <div
                key={key}
                onClick={() => onChangeBpAdjustments(prev => ({ ...prev, [key]: !prev[key] }))}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', cursor: 'pointer', userSelect: 'none' }}
              >
                <AppCheckbox checked={checked} onChange={() => {}} />
                <span style={{ flex: 1, fontSize: '0.85rem', color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, color: checked ? (value > 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-secondary)', minWidth: '3.5rem', textAlign: 'right' }}>
                  {checked ? formatModifier(value) : '—'}
                </span>
              </div>
            )
          })}

          {/* Auto adjustment: 2+ Solos */}
          <div style={autoRowStyle}>
            <AutoTag />
            <span style={{ flex: 1, fontSize: '0.85rem', color: twoOrMoreSolos ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: 'italic' }}>
              2+ Solos
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, color: twoOrMoreSolos ? 'var(--danger)' : 'var(--text-secondary)', minWidth: '3.5rem', textAlign: 'right' }}>
              {twoOrMoreSolos ? formatModifier(BATTLE_POINT_ADJUSTMENTS.twoOrMoreSolos) : '—'}
            </span>
          </div>

          {/* Auto adjustment: no major threats */}
          <div style={autoRowStyle}>
            <AutoTag />
            <span style={{ flex: 1, fontSize: '0.85rem', color: noMajorThreats ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: 'italic' }}>
              No Major Threats
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, color: noMajorThreats ? 'var(--success)' : 'var(--text-secondary)', minWidth: '3.5rem', textAlign: 'right' }}>
              {noMajorThreats ? formatModifier(BATTLE_POINT_ADJUSTMENTS.noBruisersHordesLeadersSolos) : '—'}
            </span>
          </div>

          {/* Party Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', marginTop: '0.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
              <button onClick={() => onChangePcCount(Math.max(1, pcCount - 1))} style={actionBtn(false)}>
                <Minus size={13} />
              </button>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, minWidth: '1.2rem', textAlign: 'center' }}>{pcCount}</span>
              <button onClick={() => onChangePcCount(pcCount + 1)} style={actionBtn(false)}>
                <Plus size={13} />
              </button>
            </div>
            <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Party Size</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, color: 'var(--text-secondary)', minWidth: '3.5rem', textAlign: 'right' }}>
              {baseBP} BP
            </span>
          </div>

        </div>
      </div>

      {/* Sticky footer — Remaining is the dominant number; Budget/Used are smaller
          supporting figures underneath it (#78). */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '0.5rem 1rem 0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0.15rem 0' }}>
          <span style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
            {spentBattlePoints > availableBattlePoints ? 'Over Budget' : 'Remaining'}
          </span>
          <span style={{
            color: spentBattlePoints > availableBattlePoints ? 'var(--danger)'
                 : spentBattlePoints === availableBattlePoints ? 'var(--purple)'
                 : 'var(--success)',
            fontWeight: 700, fontSize: '1.15rem',
          }}>
            {spentBattlePoints > availableBattlePoints
              ? `${spentBattlePoints - availableBattlePoints} BP`
              : `${availableBattlePoints - spentBattlePoints} BP`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.1rem 0' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Budget</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{availableBattlePoints} BP</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.1rem 0' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Used</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{spentBattlePoints} BP</span>
        </div>
      </div>

    </div>
  )
}

export default EncounterReceipt
