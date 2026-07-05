import React, { useState } from 'react'
import { TYPES } from './customCreatorConstants'
import { typeGuide } from './adversaryTypeGuide'

// Content for the InfoPopover next to the "Type" label in
// CustomAdversaryCreator.jsx — lists every type with its summary. Per-row
// type descriptions in the dropdown itself were removed (#125) in favor of
// this single popover, so picking a type doesn't require reading a
// paragraph per row.
export const TypeInfoContent = ({ selectedType }) => (
  <>
    <div style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Adversary Types</div>
    {TYPES.map(t => (
      <div key={t} style={{ padding: '0.25rem 0', color: t === selectedType ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        <span style={{ fontWeight: t === selectedType ? 700 : 600 }}>{t}</span>
        {typeGuide[t]?.summary && <div style={{ marginTop: '0.1rem' }}>{typeGuide[t].summary}</div>}
      </div>
    ))}
  </>
)

// Type dropdown for the custom adversary creator.
export const TypeSelector = ({ selectedType, onTypeChange }) => {
  const [typeOpen, setTypeOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setTypeOpen(v => !v)} style={{
        width: '100%', textAlign: 'left',
        background: 'var(--bg-secondary)',
        border: `1px solid ${typeOpen ? 'var(--purple)' : 'var(--border)'}`,
        borderRadius: typeOpen ? '0.25rem 0.25rem 0 0' : '0.25rem',
        padding: '0.4rem 0.6rem',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
        minHeight: '44px',
      }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedType}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', flexShrink: 0 }}>{typeOpen ? '▲' : '▼'}</span>
      </button>
      {typeOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          border: '1px solid var(--purple)', borderTop: 'none',
          borderRadius: '0 0 0.25rem 0.25rem',
          backgroundColor: 'var(--bg-primary)',
          maxHeight: '260px', overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {TYPES.map(t => {
            const isSelected = selectedType === t
            return (
              <button key={t} type="button" onClick={() => { onTypeChange(t); setTypeOpen(false) }} style={{
                width: '100%', textAlign: 'left',
                background: isSelected ? 'color-mix(in srgb, var(--purple) 15%, transparent)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)',
                padding: '0.4rem 0.6rem', cursor: 'pointer', minHeight: '44px',
                fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--purple)' : 'var(--text-primary)',
              }}>
                {t}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TypeSelector
