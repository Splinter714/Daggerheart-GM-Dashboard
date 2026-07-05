import React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import Browser from '../Browser/Browser'
import EncounterReceipt from './EncounterReceipt'
import { DASHBOARD_GAP, PANEL_BORDER, PANEL_BORDER_RADIUS, PANEL_BOX_SHADOW } from './constants'
import logoImage from '../../assets/daggerheart-logo.svg'

const SORT_OPTIONS = [
  { value: 'name',       label: 'Name'             },
  { value: 'tier',       label: 'Tier'             },
  { value: 'type',       label: 'Type'             },
  { value: 'hp',         label: 'Max HP'           },
  { value: 'difficulty', label: 'Difficulty'       },
  { value: 'atk',        label: 'Attack'           },
  { value: 'threshold',  label: 'Damage threshold' },
]

const GROUP_OPTIONS = [
  { value: 'type', label: 'Type' },
  { value: 'tier', label: 'Tier' },
]

const ColumnHeader = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
    <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{title}</span>
  </div>
)


// Shared segmented-button control for the Info panel's global display toggles.
const ToggleRow = ({ label, value, options, onChange }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
      {label}
    </div>
    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
            background: value === opt.value ? 'var(--purple)' : 'var(--bg-secondary)',
            color: value === opt.value ? 'white' : 'var(--text-primary)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
)

// Sort-by/group-by option row, shared styling with the Colossus/Instance toggles below it.
const optRow = (selected) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.25rem 0.5rem',
  borderRadius: '6px',
  cursor: 'pointer',
  background: selected ? 'color-mix(in srgb, var(--purple) 12%, transparent)' : 'transparent',
  color: selected ? 'var(--purple)' : 'var(--text-primary)',
  fontSize: '0.85rem',
  userSelect: 'none',
  justifyContent: 'space-between',
})

const optDot = (selected) => ({
  width: 14, height: 14,
  borderRadius: '50%',
  border: `2px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
  backgroundColor: selected ? 'var(--purple)' : 'transparent',
  flexShrink: 0,
  transition: 'background 0.1s, border-color 0.1s',
})

// Board-wide sort/group-by controls — relocated here from the standalone
// SortGroupPopover (#111) so all app configuration lives in one Settings area.
const SortGroupSection = ({ sortBy, sortDir, groupBy, onSortBy, onGroupBy }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
      Sort by
    </div>
    {SORT_OPTIONS.map(({ value, label }) => {
      const selected = sortBy === value
      return (
        <div key={value} style={optRow(selected)} onClick={() => onSortBy(value)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={optDot(selected)} />
            {label}
          </div>
          {selected && (
            sortDir === 'asc'
              ? <ArrowUp size={13} strokeWidth={2.2} />
              : <ArrowDown size={13} strokeWidth={2.2} />
          )}
        </div>
      )
    })}
    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0.75rem 0 0.5rem' }}>
      Group by
    </div>
    {GROUP_OPTIONS.map(({ value, label }) => (
      <div key={value} style={optRow(groupBy === value)} onClick={() => onGroupBy(value)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={optDot(groupBy === value)} />
          {label}
        </div>
      </div>
    ))}
  </div>
)

const InfoContent = ({
  colossusDisplayMode, onColossusDisplayModeChange,
  instanceLabelStyle, onInstanceLabelStyleChange,
  sortBy, sortDir, groupBy, onSortBy, onGroupBy,
}) => (
  <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
    <img src={logoImage} alt="Daggerheart Community Content Logo"
      width="639" height="156"
      style={{ width: '100%', maxWidth: '220px', height: 'auto', display: 'block', margin: '0 auto 1.25rem' }}
      onError={(e) => { e.target.style.display = 'none' }} />
    {onSortBy && onGroupBy && (
      <SortGroupSection
        sortBy={sortBy}
        sortDir={sortDir}
        groupBy={groupBy}
        onSortBy={onSortBy}
        onGroupBy={onGroupBy}
      />
    )}
    {onColossusDisplayModeChange && (
      <ToggleRow
        label="Colossus display"
        value={colossusDisplayMode}
        onChange={onColossusDisplayModeChange}
        options={[{ value: 'nested', label: 'Nested' }, { value: 'segments', label: 'Segments' }]}
      />
    )}
    {onInstanceLabelStyleChange && (
      <ToggleRow
        label="Instance labels"
        value={instanceLabelStyle}
        onChange={onInstanceLabelStyleChange}
        options={[{ value: 'numeric', label: '1, 2, 3' }, { value: 'alphabetic', label: 'A, B, C' }]}
      />
    )}
    <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
      <p style={{ marginTop: 0 }}>This product includes materials from the Daggerheart System Reference Document 1.0, © Critical Role, LLC, under the terms of the Darrington Press Community Gaming (DPCGL) License.</p>
      <p>More information can be found at{' '}<a href="https://www.daggerheart.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)', textDecoration: 'underline' }}>daggerheart.com</a></p>
      <p style={{ marginBottom: 0 }}><em>This project is unofficial and not endorsed by Darrington Press or Critical Role.</em></p>
    </div>
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', color: 'var(--text-primary)', border: 'none', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }}
        onClick={() => window.open('https://github.com/Splinter714/Daggerheart', '_blank')}>
        <span>View on GitHub</span><span>→</span>
      </button>
      <div style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
        Version {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}
      </div>
    </div>
  </div>
)

// Convert live adversaryGroups into the encounterItems format EncounterReceipt expects.
// Colossi are one-of-a-kind encounters, not stackable instances (#99) — each instance
// becomes its own separate, non-grouped encounterItem (quantity 1) keyed by instance id,
// instead of being quantified together like minions/other adversaries.
export const groupsToEncounterItems = (adversaryGroups, pcCount) =>
  adversaryGroups.flatMap((group) => {
    const { instances, ...itemData } = group
    if (group.isColossus) {
      return instances.map((inst) => ({
        type: 'adversary',
        item: { ...itemData, id: inst.id, name: group.baseName },
        quantity: 1,
      }))
    }
    const isMinion = group.type === 'Minion'
    const qty = isMinion ? Math.round(group.instances.length / pcCount) : group.instances.length
    const entry = { type: 'adversary', item: { ...itemData, id: itemData.id || group.baseName, name: group.baseName }, quantity: qty }
    // Minions cost BP per group of pcCount instances, but the GM also needs the actual
    // instance/token count on the table, which differs from the BP-group quantity (#87).
    if (isMinion) entry.instanceCount = group.instances.length
    return [entry]
  })

// mode: 'browser' | 'info' | 'receipt'
const RightColumn = ({
  open, mode, columnWidth, onClose,
  browserContentType,
  browserActiveTab, onTabChange,
  selectedCustomAdversaryId, onSelectCustomAdversary,
  onAddAdversaryFromBrowser,
  onAddEnvironmentFromBrowser,
  pcCount, updatePartySize,
  adversaryGroups, createAdversary, createAdversariesBulk, deleteAdversary,
  bpAdjustments, onChangeBpAdjustments,
  availableBattlePoints, spentBattlePoints,
  sortBy, sortDir, groupBy, onSortBy, onGroupBy,
  colossusDisplayMode, onColossusDisplayModeChange,
  instanceLabelStyle, onInstanceLabelStyleChange,
  onOpenReceipt,
}) => {

  const encounterItems = groupsToEncounterItems(adversaryGroups, pcCount)

  const handleAdd = (item) => {
    const isMinion = item.type === 'Minion'
    if (isMinion) {
      createAdversariesBulk(Array(pcCount).fill(null).map(() => ({ ...item })))
    } else {
      createAdversary({ ...item })
    }
  }

  const handleRemove = (itemId) => {
    const group = adversaryGroups.find(g => g.id === itemId || g.baseName === itemId)
    if (!group) {
      // Colossus rows are keyed by instance id (each instance is its own row, #99) —
      // find the owning group and remove just that instance.
      const owningGroup = adversaryGroups.find(g => g.isColossus && g.instances.some(inst => inst.id === itemId))
      if (owningGroup) deleteAdversary(itemId)
      return
    }
    const isMinion = group.type === 'Minion'
    const removeCount = isMinion ? pcCount : 1
    const sorted = [...group.instances].sort((a, b) => (b.duplicateNumber || 1) - (a.duplicateNumber || 1))
    sorted.slice(0, removeCount).forEach(inst => deleteAdversary(inst.id))
  }

  return (
    <div style={{
      position: 'absolute',
      top: `${DASHBOARD_GAP}px`, right: `${DASHBOARD_GAP}px`, bottom: `${DASHBOARD_GAP}px`,
      width: `${columnWidth}px`,
      zIndex: 100,
      backgroundColor: 'var(--bg-primary)',
      border: PANEL_BORDER,
      borderRadius: PANEL_BORDER_RADIUS,
      boxShadow: PANEL_BOX_SHADOW,
      display: open ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden',
    }}>
      {mode === 'browser' && (
        <>
          <ColumnHeader title={browserContentType === 'environment' ? 'Add Environments' : 'Add Adversaries'} />
          {browserContentType === 'adversary' ? (
            <Browser
              type="adversary"
              onAddItem={onAddAdversaryFromBrowser}
              showContainer={false}
              activeTab={browserActiveTab}
              onTabChange={onTabChange}
              selectedCustomAdversaryId={selectedCustomAdversaryId}
              onSelectCustomAdversary={onSelectCustomAdversary}
              autoFocus={open}
              hideImportExport={true}
              onClose={null}
              searchPlaceholder="Search adversaries"
              encounterItems={encounterItems}
              pcCount={pcCount}
              onOpenReceipt={onOpenReceipt}
            />
          ) : (
            <Browser
              type="environment"
              onAddItem={onAddEnvironmentFromBrowser}
              showContainer={false}
              activeTab="adversaries"
              autoFocus={open && browserContentType === 'environment'}
              hideImportExport={true}
              onClose={null}
              searchPlaceholder="Search environments"
            />
          )}
        </>
      )}

      {mode === 'info' && (
        <>
          <ColumnHeader title="Settings" />
          <InfoContent
            colossusDisplayMode={colossusDisplayMode}
            onColossusDisplayModeChange={onColossusDisplayModeChange}
            instanceLabelStyle={instanceLabelStyle}
            onInstanceLabelStyleChange={onInstanceLabelStyleChange}
            sortBy={sortBy}
            sortDir={sortDir}
            groupBy={groupBy}
            onSortBy={onSortBy}
            onGroupBy={onGroupBy}
          />
        </>
      )}

      {mode === 'receipt' && (
        <>
          <ColumnHeader title="Encounter List" />
          <EncounterReceipt
            encounterItems={encounterItems}
            pcCount={pcCount}
            onChangePcCount={updatePartySize}
            onAdd={handleAdd}
            onRemove={handleRemove}
            bpAdjustments={bpAdjustments}
            onChangeBpAdjustments={onChangeBpAdjustments}
            availableBattlePoints={availableBattlePoints}
            spentBattlePoints={spentBattlePoints}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortBy={onSortBy}
          />
        </>
      )}
    </div>
  )
}

export default RightColumn
