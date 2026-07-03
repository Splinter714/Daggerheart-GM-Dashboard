import React, { useEffect, useRef } from 'react'
import { styles } from './Browser.styles'

// Running BP balance while the adversary browser is open (#31) — lets the GM see
// encounter cost without leaving the browser to check the receipt panel.
const BudgetBadge = ({ remainingBudget }) => (
  <span style={{
    display: 'flex', alignItems: 'center', flexShrink: 0,
    fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.55rem', borderRadius: '6px',
    border: '1px solid var(--border)',
    color: remainingBudget < 0 ? 'var(--danger)' : 'var(--text-primary)',
    whiteSpace: 'nowrap',
  }}>
    {remainingBudget < 0 ? `${Math.abs(remainingBudget)} BP over` : `${remainingBudget} BP left`}
  </span>
)

// Browser Header Component — extracted from Browser.jsx (Phase 4).
const BrowserHeader = ({ searchTerm, onSearchChange, type, partyControls, showCustomToggle = false, onToggleCustom, filterCustom = false, onExportCustomAdversaries, onImportCustomAdversaries, autoFocus = false, onClose = null, placeholder = "Search", remainingBudget = null }) => {
  const searchInputRef = useRef(null)
  
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      // Small delay to ensure the browser is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [autoFocus])
  
  return (
    <div className="browser-header" style={styles.browserHeader}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
      <input
          ref={searchInputRef}
        type="text"
          placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
          style={{ ...styles.searchInput, flex: 1, marginRight: 0 }}
      />
        {remainingBudget !== null && <BudgetBadge remainingBudget={remainingBudget} />}
      </div>

      {partyControls && (
        <div style={styles.partyControls}>
          {partyControls}
        </div>
      )}
    </div>
  )
}

export default BrowserHeader
