import React from 'react'
import Browser from '../Browser/Browser'
import EncounterReceipt from './EncounterReceipt'
import { DASHBOARD_GAP, PANEL_BORDER, PANEL_BORDER_RADIUS, PANEL_BOX_SHADOW } from './constants'
import logoImage from '../../assets/daggerheart-logo.svg'

const ColumnHeader = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
    <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{title}</span>
  </div>
)


const InfoContent = ({ colossusDisplayMode, onColossusDisplayModeChange }) => (
  <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
    <img src={logoImage} alt="Daggerheart Community Content Logo"
      width="639" height="156"
      style={{ width: '100%', maxWidth: '220px', height: 'auto', display: 'block', margin: '0 auto 1.25rem' }}
      onError={(e) => { e.target.style.display = 'none' }} />
    {onColossusDisplayModeChange && (
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Colossus display
        </div>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {[
            { value: 'nested', label: 'Nested' },
            { value: 'segments', label: 'Segments' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onColossusDisplayModeChange(value)}
              style={{
                flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                background: colossusDisplayMode === value ? 'var(--purple)' : 'var(--bg-secondary)',
                color: colossusDisplayMode === value ? 'white' : 'var(--text-primary)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
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
        <InfoContent
          colossusDisplayMode={colossusDisplayMode}
          onColossusDisplayModeChange={onColossusDisplayModeChange}
        />
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
