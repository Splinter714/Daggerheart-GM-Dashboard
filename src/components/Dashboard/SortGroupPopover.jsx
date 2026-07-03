import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, ArrowDown } from 'lucide-react'

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

const SortGroupPopover = ({ anchorRef, placement, sortBy, sortDir, groupBy, onSortBy, onGroupBy, onClose }) => {
  const popoverRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose, anchorRef])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const getPosition = () => {
    if (!anchorRef.current) return {}
    const rect = anchorRef.current.getBoundingClientRect()
    if (placement === 'right') {
      return { right: `calc(100vw - ${rect.left}px + 6px)`, top: `${rect.top}px` }
    }
    // Bottom placement (mobile): clamp left so popover stays within viewport
    const minWidth = 190
    const margin = 8
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - minWidth - margin))
    return { left: `${left}px`, bottom: `calc(100vh - ${rect.top}px + 6px)` }
  }

  const pos = getPosition()

  const sectionLabel = {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: '0.4rem',
  }

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

  const dot = (selected) => ({
    width: 14, height: 14,
    borderRadius: '50%',
    border: `2px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
    backgroundColor: selected ? 'var(--purple)' : 'transparent',
    flexShrink: 0,
    transition: 'background 0.1s, border-color 0.1s',
  })

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        ...pos,
        zIndex: 300,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        padding: '1rem',
        minWidth: '190px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div>
        <div style={sectionLabel}>Sort by</div>
        {SORT_OPTIONS.map(({ value, label }) => {
          const selected = sortBy === value
          return (
            <div
              key={value}
              style={optRow(selected)}
              onClick={() => onSortBy(value)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={dot(selected)} />
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
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <div style={sectionLabel}>Group by</div>
        {GROUP_OPTIONS.map(({ value, label }) => (
          <div
            key={value}
            style={optRow(groupBy === value)}
            onClick={() => onGroupBy(value)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={dot(groupBy === value)} />
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}

export default SortGroupPopover
