import React, { useState, useEffect, useRef } from 'react'
import { X, Hexagon, Locate, Check, Minus, Plus, Pencil } from 'lucide-react'
import ContainerWithTab from '../Dashboard/ContainerWithTab'
import CustomAdversaryCreator from './CustomAdversaryCreator'
import FeaturesSection from './GameCard/FeaturesSection'
import StatusSection from './GameCard/StatusSection'
import DescriptionSection from './GameCard/DescriptionSection'
import ExperienceSection from './GameCard/ExperienceSection'
import { CARD_SPACE_H, CARD_SPACE_V } from './GameCard/constants'
import { DASHBOARD_GAP, TAB_HEIGHT } from '../Dashboard/constants'
import { highlightCardText } from './GameCard/textHighlighter'
import MergedStatBadge from './GameCard/MergedStatBadge'
import TabButtons from './GameCard/TabButtons'
import ColossusSegmentCard, { Divider, FeatureList, HpPips, sortSegments } from './GameCard/ColossusSegmentCard'

const INSTANCE_COLORS = [
  { value: 'var(--red)',    label: 'Red' },
  { value: 'var(--gold)',   label: 'Gold' },
  { value: 'var(--green)',  label: 'Green' },
  { value: 'var(--blue)',   label: 'Blue' },
  { value: 'var(--purple)', label: 'Purple' },
  { value: 'var(--black)',  label: 'Black' },
]

// ============================================================================
// STYLES - All CSS consolidated into inline styles
// ============================================================================

const styles = {
  // Transition definitions - centralized
  transitions: {
    hoverIn: 'all 0.1s ease',        // Fast hover-in
    hoverOut: 'all 0.3s ease',       // Graceful hover-out
  },

  // Container styles
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    position: 'relative',
    border: 'none' // Border is handled by ContainerWithTab
  },
  cardHover: {
    backgroundColor: 'var(--bg-card-hover)'
  },
  cardDead: {
    opacity: 0.6,
    backgroundColor: 'var(--gray-800)',
    borderColor: 'var(--border)'
  },
  rowTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GameCard = ({
  item,
  type, // 'adversary'
  mode = 'expanded', // 'expanded', 'edit'
  onClick,
  onApplyDamage,
  onApplyHealing,
  onApplyStressChange,
  onUpdate,
  adversaries = [], // All adversaries for duplicate checking
  isSelected = false, // Whether this card is currently selected
  instances = [], // All instances to embed as mini-cards in expanded view
  isEmbedded = false, // Whether this is an embedded card (removes border)
  onAddInstance = null, // Handler for adding an instance
  onRemoveInstance = null, // Handler for removing an instance
  onEdit = null, // Handler for editing this adversary
  showCustomCreator = false, // Show CustomAdversaryCreator instead of normal card content
  onSaveCustomAdversary = null, // Handler for saving custom adversary
  onCancelEdit = null, // Handler for canceling edit
  isStockAdversary = false, // Whether this is a stock adversary (needs Save As)
  onDelete = null, // Handler for removing an environment from the session
  segment = null, // Colossus segment data — set to render this segment as its own standalone card
  segmentKey = null, // Segment HP tracking key (differs from segment.id when count > 1)
}) => {
  const nameInputRef = useRef(null)
  const customCreatorRef = useRef(null)
  const cardRef = useRef(null)
  const scrollableRef = useRef(null)
  const prevInstancesLengthRef = useRef(instances.length)

  // Scroll newly added instance into view (minimum scroll, only if needed)
  useEffect(() => {
    const prev = prevInstancesLengthRef.current
    prevInstancesLengthRef.current = instances.length
    if (instances.length === prev || !scrollableRef.current) return
    return // scroll disabled

    const aliveInstances = instances.filter(i => (i.hp || 0) < (i.hpMax || 1))
    if (!aliveInstances.length) return
    const newest = aliveInstances.reduce((a, b) => (a.duplicateNumber || 1) > (b.duplicateNumber || 1) ? a : b)

    requestAnimationFrame(() => {
      const el = scrollableRef.current?.querySelector(`[data-instance-id="${newest.id}"]`)
      if (!el) return
      const scrollable = scrollableRef.current
      const elRect = el.getBoundingClientRect()
      const sRect = scrollable.getBoundingClientRect()
      if (elRect.top < sRect.top) {
        scrollable.scrollBy({ top: elRect.top - sRect.top - 8, behavior: 'smooth' })
      } else if (elRect.bottom > sRect.bottom) {
        scrollable.scrollBy({ top: elRect.bottom - sRect.bottom + 8, behavior: 'smooth' })
      }
    })
  }, [instances.length])

  // Quick edit mode — local toggle, saves immediately via onUpdate, no Save/Cancel needed
  const [quickEdit, setQuickEdit] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Exit edit mode when clicking/tapping outside the card, or pressing Enter/Escape
  useEffect(() => {
    if (!quickEdit) return
    const handleOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setQuickEdit(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setQuickEdit(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [quickEdit])

  // State for two-stage delete functionality
  const [deleteConfirmations, setDeleteConfirmations] = useState({})
  
  // Auto-focus name input when entering edit mode for newly created custom adversary
  useEffect(() => {
    if (showCustomCreator && nameInputRef.current) {
      // Delay to ensure DOM is ready and scroll has completed (scroll animation is 600ms)
      const timeoutId = setTimeout(() => {
        nameInputRef.current?.focus()
        nameInputRef.current?.select() // Select text if any
      }, 650) // Wait for scroll animation to complete
      
      return () => clearTimeout(timeoutId)
    }
  }, [showCustomCreator])
  // Helper function to generate unique keys for feature confirmations
  const getFeatureKey = (feature) => {
    const typeFeatures = (item.features || []).filter(f => f.type === feature.type)
    const featureIndex = typeFeatures.findIndex(f => f === feature)
    return `${feature.type}-${featureIndex}-${feature.name || 'blank'}`
  }
  
  // Helper function to generate unique keys for experience confirmations
  // Handle two-stage delete for features
  const handleFeatureDeleteClick = (featureToDelete) => {
    const featureKey = getFeatureKey(featureToDelete)
    
    if (deleteConfirmations[featureKey]) {
      // Second click - actually delete
      const newFeatures = item.features.filter(f => f !== featureToDelete)
      onUpdate && onUpdate(item.id, { features: newFeatures })
      
      setDeleteConfirmations(prev => {
        const newState = { ...prev }
        delete newState[featureKey]
        return newState
      })
    } else {
      // First click - show confirmation state
      setDeleteConfirmations(prev => ({
        ...prev,
        [featureKey]: true
      }))
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setDeleteConfirmations(prev => {
          const newState = { ...prev }
          delete newState[featureKey]
          return newState
        })
      }, 3000)
    }
  }

  // Get adversary-specific logic
  // Debug logging removed - selection styling working correctly

  // ============================================================================
  // STYLING LOGIC
  // ============================================================================

  const getCardStyle = (isExpanded = false) => {
    let cardStyle = { ...styles.card }
    
    // Use instant transitions for selection changes
    if (isSelected) {
      cardStyle.transition = 'none' // Instant for selection
    } else {
      cardStyle.transition = styles.transitions.hoverOut
    }
    
    // Remove top margin for expanded cards
    if (isExpanded) {
      const { marginTop: _marginTop, ...cardStyleWithoutMargin } = cardStyle
      cardStyle = cardStyleWithoutMargin
    }
    
    // Apply hover effects when selected
    if (isSelected) {
      cardStyle = { ...cardStyle, ...styles.cardHover }
    }
    
    if (type === 'adversary' && (item.hp || 0) >= (item.hpMax || 1)) {
      cardStyle = { ...cardStyle, ...styles.cardDead }
    }
    
    
    return cardStyle
  }

  const getCardClassName = () => {
    if (isEmbedded) {
      return '' // No border or rounded corners for embedded cards
    }
    
    let className = 'border rounded-lg'
    
    // Apply border hover effect when selected
    if (isSelected) {
      className += ' border-hover'
    }
    
    return className
  }

  // ============================================================================
  // RENDERING HELPERS
  // ============================================================================

  // ============================================================================
  // EXPANDED VIEW RENDERERS
  // ============================================================================

  const renderExpandedAdversary = () => {
    const isDead = (item.hp || 0) >= (item.hpMax || 1)
    const isEditMode = effectiveMode === 'edit' || showCustomCreator
    
    // Tab only shown in custom creator mode (Save/Cancel buttons)
    const shouldShowTab = (type === 'adversary') && showCustomCreator
    
    // Build tab content
    const tabContent = shouldShowTab ? (
      <TabButtons
        showCustomCreator={showCustomCreator}
        onSaveCustomAdversary={onSaveCustomAdversary}
        item={item}
        onCancelEdit={onCancelEdit}
        onRemoveInstance={onRemoveInstance}
        onAddInstance={onAddInstance}
        instances={instances}
        onEdit={onEdit}
      />
    ) : null

    return (
      <ContainerWithTab
        tabContent={tabContent}
        showTab={shouldShowTab}
        tabBorderColor={isSelected ? 'var(--purple)' : 'var(--border)'}
        containerBackgroundColor={isDead ? 'var(--gray-900)' : getCardStyle(true).backgroundColor}
        containerBorderColor={isDead ? 'color-mix(in srgb, var(--gray-600) 40%, transparent)' : (isSelected ? 'var(--purple)' : 'var(--border)')}
        containerBorderRadius="0.5rem"
        containerOverflow="hidden"
        containerStyle={{
          padding: 0,
          opacity: isDead ? 0.7 : 1,
          height: 'auto',
          // When tab is visible, reserve space for it (120px for bars + padding)
          // When tab is not visible, add back the tab height (52px) to extend lower
          maxHeight: shouldShowTab ? `calc(100vh - ${2 * DASHBOARD_GAP + TAB_HEIGHT}px)` : `calc(100vh - ${2 * DASHBOARD_GAP}px)`,
          minHeight: 0
        }}
      >
      <div
        ref={cardRef}
        className={getCardClassName()}
        style={{
          ...getCardStyle(true),
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
            position: 'relative',
            height: '100%',
            minHeight: 0,
            border: 'none',
            borderRadius: 0
        }}
        onClick={onClick}
        onMouseDown={(e) => {
          if (showCustomCreator) return
          // Entering edit: block on any interactive element
          // Exiting edit: only block on buttons (inputs/textareas are fair game to long-press on)
          if (!quickEdit && e.target.closest('button, input, textarea')) return
          if (quickEdit && e.target.closest('button')) return
          const timer = setTimeout(() => setQuickEdit(prev => !prev), 500)
          e.currentTarget._longPressTimer = timer
        }}
        onMouseUp={(e) => clearTimeout(e.currentTarget._longPressTimer)}
        onMouseLeave={(e) => clearTimeout(e.currentTarget._longPressTimer)}
        onTouchStart={(e) => {
          if (showCustomCreator) return
          if (!quickEdit && e.target.closest('button, input, textarea')) return
          if (quickEdit && e.target.closest('button')) return
          const timer = setTimeout(() => setQuickEdit(prev => !prev), 500)
          e.currentTarget._longPressTimer = timer
        }}
        onTouchEnd={(e) => clearTimeout(e.currentTarget._longPressTimer)}
        onTouchMove={(e) => clearTimeout(e.currentTarget._longPressTimer)}
        onTouchCancel={(e) => clearTimeout(e.currentTarget._longPressTimer)}
      >
        {/* DEFEATED overlay */}
        {isDead && (
          <>
            {/* Diagonal striping pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 8px,
                var(--gray-600) 1px,
                var(--gray-600) 9px
              )`,
              pointerEvents: 'none',
              zIndex: 9999
            }} />
          </>
        )}
        {/* Fixed Header Section - Identical to Compact View */}
        <div className="border-b" style={{
          paddingTop: CARD_SPACE_V,
          paddingBottom: CARD_SPACE_V,
          paddingLeft: CARD_SPACE_H,
          paddingRight: CARD_SPACE_H,
          flexShrink: 0,
          backgroundColor: 'var(--bg-card)',
          borderRadius: '0.5rem 0.5rem 0 0',
          position: 'relative',
          zIndex: isDead ? 1 : 'auto',
          borderBottomColor: isSelected ? 'var(--purple)' : 'var(--border)'
        }}>
          {quickEdit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: '1.5rem', overflow: 'visible' }}>
              <div style={{ position: 'relative', flexShrink: 0, height: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowColorPicker(v => !v) }}
                  title="Instance color"
                  style={{
                    width: '1.5rem', height: '1.5rem', borderRadius: '50%', flexShrink: 0,
                    background: item.color || 'black', border: '1px solid white',
                    cursor: 'pointer', padding: 0,
                  }}
                />
                {showColorPicker && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                      backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
                      borderRadius: '0.5rem', padding: '0.5rem', zIndex: 200,
                      display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', justifyContent: 'center' }}>
                      {INSTANCE_COLORS.map(({ value, label }) => {
                        const isSelected = item.color === value
                        return (
                          <button
                            key={value}
                            onClick={() => { onUpdate && onUpdate(item.id, { color: value }) }}
                            title={label}
                            style={{
                              width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                              background: value, border: '1px solid white',
                              cursor: 'pointer', padding: 0, position: 'relative',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} color="white" />}
                          </button>
                        )
                      })}
                    </div>
                    <input
                      type="color"
                      value={item.color && !INSTANCE_COLORS.find(c => c.value === item.color) ? item.color : '#4a9edd'}
                      onChange={(e) => { onUpdate && onUpdate(item.id, { color: e.target.value }) }}
                      style={{ width: '100%', height: '2rem', border: '1px solid var(--border)', borderRadius: '0.25rem', cursor: 'pointer', padding: '2px' }}
                    />
                  </div>
                )}
              </div>
              <input
                ref={nameInputRef}
                type="text"
                value={item.baseName || item.name?.replace(/\s+\(\d+\)$/, '') || ''}
                onChange={(e) => {
                  if (onUpdate && item.id) onUpdate(item.id, { name: e.target.value, baseName: e.target.value })
                }}
                style={{
                  flex: 1, minWidth: 0,
                  backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: '0.25rem', color: 'var(--text-primary)',
                  fontSize: '1rem', fontWeight: '600',
                  height: '1.5rem', padding: '0 6px', boxSizing: 'border-box',
                }}
                placeholder="Name"
              />
              {(onRemoveInstance || onAddInstance) && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveInstance?.(item.id) }}
                    style={{
                      flexShrink: 0, width: '1.5rem', height: '1.5rem',
                      background: 'var(--gray-700)', border: '1px solid var(--gray-600)', borderRadius: '0.25rem',
                      color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                    title="Remove one"
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'white', flexShrink: 0, display: 'inline-block', minWidth: '0.9rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {instances.length}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddInstance?.(item) }}
                    style={{
                      flexShrink: 0, width: '1.5rem', height: '1.5rem',
                      background: 'var(--gray-700)', border: '1px solid var(--gray-600)', borderRadius: '0.25rem',
                      color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                    title="Add one"
                  >
                    <Plus size={12} />
                  </button>
                </>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (deleteConfirm) {
                      onDelete()
                    } else {
                      setDeleteConfirm(true)
                      setTimeout(() => setDeleteConfirm(false), 3000)
                    }
                  }}
                  style={{
                    flexShrink: 0, width: '1.5rem', height: '1.5rem',
                    background: deleteConfirm ? 'var(--danger)' : 'black',
                    border: deleteConfirm ? 'none' : '1px solid var(--gray-600)',
                    borderRadius: '0.25rem',
                    color: deleteConfirm ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  title={deleteConfirm ? 'Click again to confirm' : 'Remove all'}
                >
                  <X size={12} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setQuickEdit(false); setShowColorPicker(false); setDeleteConfirm(false) }}
                style={{
                  flexShrink: 0, width: '1.5rem', height: '1.5rem',
                  background: 'var(--purple)', border: 'none', borderRadius: '0.25rem',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}
                title="Done editing"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setQuickEdit(true) }}
                style={{
                  position: 'absolute', right: CARD_SPACE_H, top: '50%', transform: 'translateY(-50%)', zIndex: 1,
                  width: '1.5rem', height: '1.5rem',
                  background: 'transparent', border: 'none', borderRadius: '0.25rem',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, transition: 'all 0.15s ease',
                }}
                title="Edit"
              >
                <Pencil size={12} />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: isDead ? 1 : 'auto', padding: 0, gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                    <h4 style={{
                      ...styles.rowTitle,
                      color: isDead ? 'color-mix(in srgb, var(--gray-400) 80%, transparent)' : styles.rowTitle.color,
                      margin: 0,
                      fontSize: '1rem',
                      height: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      minWidth: 0,
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name?.replace(/\s+\(\d+\)$/, '') || item.name}
                      </span>
                      {(onAddInstance || onRemoveInstance) && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)', flexShrink: 0 }}>
                          ({instances.length})
                        </span>
                      )}
                    </h4>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Expandable Content Section - Scrollable */}
                  <div
          ref={scrollableRef}
          style={{
          borderRadius: '0 0 0.5rem 0.5rem',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0 // Allow flex child to shrink below content size
        }}
        className="invisible-scrollbar"
        >





        {/* ATK badge + weapon pill row */}
        {!isEditMode && (item.weapon || item.atk !== undefined) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, paddingTop: CARD_SPACE_V, paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H }}>
            {item.atk !== undefined && (
              <MergedStatBadge shape="diamond" label="ATK" value={(() => {
                if (typeof item.atk === 'string' && item.atk.includes('d')) return item.atk
                const atkValue = typeof item.atk === 'string' ? parseInt(item.atk.replace(/[^0-9-]/g, '')) : item.atk
                return atkValue >= 0 ? `+${atkValue}` : atkValue
              })()} />
            )}
            {item.weapon && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 400,
                lineHeight: 1.3,
                backgroundColor: 'black',
                border: '1px solid var(--text-secondary)',
                borderRadius: '0.25rem',
                minHeight: '1.375rem',
                padding: '0.2rem 0.4rem',
                flex: 1,
                minWidth: 0,
              }}>
                <span style={{ color: 'white', overflowWrap: 'normal', textAlign: 'center' }}>{item.weapon}</span>
                {item.range && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: '1px', height: '1em', backgroundColor: 'var(--text-secondary)', flexShrink: 0 }} />
                    <span style={{ color: 'white' }}>{highlightCardText(item.range)}</span>
                  </span>
                )}
                {item.damage && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: '1px', height: '1em', backgroundColor: 'var(--text-secondary)', flexShrink: 0 }} />
                    <span style={{ color: 'white' }}>{highlightCardText(item.damage)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats and Experiences - Edit mode only; read-only experience renders after StatusSection */}
        {isEditMode && (
          <div style={{
            paddingTop: CARD_SPACE_V,
            paddingBottom: 0,
            paddingLeft: CARD_SPACE_H,
            paddingRight: CARD_SPACE_H,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            alignItems: 'center',
          }}>
            {/* Stats Row - Attack + Difficulty */}
                <div style={{
              display: 'flex',
              flexDirection: 'row-reverse',
              gap: '0.5rem',
              alignItems: 'flex-start',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {/* Difficulty (edit mode only; display handled in attack row) */}
              {isEditMode && (
                  <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      paddingTop: '1px', width: '2.25rem',
                    }}>
                      <div style={{
                        position: 'absolute', width: '1.375rem', height: '1.375rem',
                        backgroundColor: 'black',
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        zIndex: 0,
                      }} />
                      <Hexagon size={32} strokeWidth={1} style={{ color: 'var(--text-secondary)', position: 'relative', zIndex: 1 }} />
                      <input
                        type="text"
                        value={item.difficulty || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          if (value.length <= 2) onUpdate && onUpdate(item.id, { difficulty: parseInt(value) || 0 })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp') { e.preventDefault(); const current = parseInt(item.difficulty) || 0; onUpdate && onUpdate(item.id, { difficulty: Math.min(current + 1, 99) }) }
                          else if (e.key === 'ArrowDown') { e.preventDefault(); const current = parseInt(item.difficulty) || 0; onUpdate && onUpdate(item.id, { difficulty: Math.max(current - 1, 0) }) }
                        }}
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -45%)', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 600, width: '1.25rem', height: '1.25rem', textAlign: 'center', outline: 'none' }}
                        maxLength="2"
                      />
                    </div>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-primary)', marginLeft: '2.75rem' }}>Difficulty</div>
                  </div>
              )}

              {/* Attack Modifier (edit mode only; display handled in attack row) */}
              {isEditMode && (
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      paddingTop: '1px', width: '2.25rem',
                    }}>
                      <div style={{ position: 'absolute', width: '1.375rem', height: '1.375rem', backgroundColor: 'black', transform: 'rotate(45deg)', zIndex: 0 }} />
                      <Locate size={38} strokeWidth={1} style={{ color: 'var(--text-secondary)', transform: 'rotate(45deg)', position: 'relative', zIndex: 1 }} />
                      <input
                        type="text"
                        value={(() => {
                          if (typeof item.atk === 'string' && item.atk.includes('d')) return item.atk
                          const atkValue = typeof item.atk === 'string' ? parseInt(item.atk.replace(/[^0-9-]/g, '')) : (item.atk || 0)
                          return atkValue >= 0 ? `+${atkValue}` : atkValue.toString()
                        })()}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value.includes('d')) { onUpdate && onUpdate(item.id, { atk: value }) }
                          else {
                            const cleanValue = value.replace(/[^0-9+-]/g, '')
                            if (cleanValue.length <= 4) { const numericValue = parseInt(cleanValue.replace(/[^0-9-]/g, '')) || 0; onUpdate && onUpdate(item.id, { atk: numericValue }) }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (typeof item.atk === 'string' && item.atk.includes('d')) return
                          if (e.key === 'ArrowUp') { e.preventDefault(); const current = typeof item.atk === 'string' ? parseInt(item.atk.replace(/[^0-9-]/g, '')) : (item.atk || 0); onUpdate && onUpdate(item.id, { atk: current + 1 }) }
                          else if (e.key === 'ArrowDown') { e.preventDefault(); const current = typeof item.atk === 'string' ? parseInt(item.atk.replace(/[^0-9-]/g, '')) : (item.atk || 0); onUpdate && onUpdate(item.id, { atk: current - 1 }) }
                        }}
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -45%)', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 600, width: '1.25rem', height: '1.25rem', textAlign: 'center', outline: 'none' }}
                        maxLength="3"
                      />
                    </div>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-primary)', marginLeft: '2.75rem' }}>Attack</div>
                  </div>
              )}
            
                </div>

            {/* Experiences Row */}
            <ExperienceSection
                              item={item}
              isEditMode={isEditMode}
                              onUpdate={onUpdate}
                              deleteConfirmations={deleteConfirmations}
              setDeleteConfirmations={setDeleteConfirmations}
            />
                        </div>
                      )}
        <StatusSection
                              item={item}
          instances={instances}
          isEditMode={isEditMode}
          type={type}
          instanceColor={item.color}
                              onUpdate={onUpdate}
          onApplyDamage={onApplyDamage}
          onApplyHealing={onApplyHealing}
          onApplyStressChange={onApplyStressChange}
          onAddInstance={onAddInstance}
          onRemoveInstance={onRemoveInstance}
        />

        <FeaturesSection
                              item={item}
          isEditMode={isEditMode}
                              onUpdate={onUpdate}
                              handleFeatureDeleteClick={handleFeatureDeleteClick}
                              deleteConfirmations={deleteConfirmations}
                              getFeatureKey={getFeatureKey}
                            />

        <DescriptionSection item={item} isEditMode={isEditMode} mode={mode} onUpdate={onUpdate} />

            </div>

      </div>
      </ContainerWithTab>
    )
  }

  // ============================================================================
  // ENVIRONMENT EXPANDED VIEW
  // ============================================================================

  const renderExpandedEnvironment = () => {
    const env = item

    const FeatureDivider = ({ title }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, marginTop: CARD_SPACE_V }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
        <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </h4>
      </div>
    )

    const renderFeatures = (featureType, label) => {
      const features = (env.features || []).filter(f => f.type === featureType)
      if (!features.length) return null
      return (
        <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H }}>
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

    return (
      <ContainerWithTab
        showTab={false}
        containerBackgroundColor={getCardStyle(true).backgroundColor}
        containerBorderColor='var(--border)'
        containerBorderRadius="0.5rem"
        containerOverflow="hidden"
        containerStyle={{
          padding: 0, height: 'auto',
          maxHeight: `calc(100vh - ${2 * DASHBOARD_GAP}px)`,
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Header */}
          <div className="border-b" style={{
            paddingTop: CARD_SPACE_V, paddingBottom: CARD_SPACE_V,
            paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H,
            flexShrink: 0, backgroundColor: 'var(--bg-card)',
            borderRadius: '0.5rem 0.5rem 0 0',
            position: 'relative',
          }}>
            {quickEdit ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete() }}
                    style={{
                      flexShrink: 0, width: '1.5rem', height: '1.5rem',
                      background: 'transparent', border: 'none', borderRadius: '0.25rem',
                      color: 'var(--danger)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                )}
                <input
                  type="text"
                  value={env.name || ''}
                  onChange={(e) => onUpdate && onUpdate(item.id, { name: e.target.value })}
                  style={{
                    flex: 1, minWidth: 0,
                    backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
                    borderRadius: '0.25rem', color: 'var(--text-primary)',
                    fontSize: '1rem', fontWeight: '600',
                    padding: '2px 6px',
                  }}
                  placeholder="Name"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setQuickEdit(false) }}
                  style={{
                    flexShrink: 0, width: '1.5rem', height: '1.5rem',
                    background: 'var(--purple)', border: 'none', borderRadius: '0.25rem',
                    color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                  title="Done editing"
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setQuickEdit(true) }}
                  style={{
                    position: 'absolute', right: CARD_SPACE_H, top: '50%', transform: 'translateY(-50%)', zIndex: 1,
                    width: '1.5rem', height: '1.5rem',
                    background: 'transparent', border: 'none', borderRadius: '0.25rem',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, transition: 'all 0.15s ease',
                  }}
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <h4 style={{
                  ...styles.rowTitle, margin: 0, fontSize: '1rem',
                  textAlign: 'center',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {env.name}
                </h4>
              </>
            )}
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="invisible-scrollbar">
            {/* Difficulty badge (prominent, matches adversary-card convention) + type/tier pill */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: CARD_SPACE_H, padding: `${CARD_SPACE_V} ${CARD_SPACE_H} 0` }}>
              {env.difficulty != null && <MergedStatBadge shape="hex" label="DIFF" value={env.difficulty} />}
              <div style={{
                display: 'inline-flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.75rem', backgroundColor: 'black',
                border: '1px solid var(--text-secondary)', borderRadius: '0.25rem', height: '1.5rem', padding: '0 10px',
              }}>
                <span style={{ color: 'white' }}>{env.type}</span>
                <span style={{ color: 'white' }}>· T{env.tier}</span>
              </div>
            </div>

            {/* Impulses */}
            {env.impulses && (
              <div style={{ padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`, textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {env.impulses}
                </span>
              </div>
            )}

            {/* Features */}
            {renderFeatures('Passive', 'Passives')}
            {renderFeatures('Action', 'Actions')}
            {renderFeatures('Reaction', 'Reactions')}

            {/* Potential Adversaries */}
            {env.potentialAdversaries && env.potentialAdversaries.length > 0 && (
              <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H, paddingBottom: CARD_SPACE_V }}>
                <FeatureDivider title="Potential Adversaries" />
                <div style={{ marginTop: CARD_SPACE_V, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                  {env.potentialAdversaries.map((adv, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{adv}</div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ height: CARD_SPACE_V }} />
          </div>
        </div>
      </ContainerWithTab>
    )
  }

  const renderExpandedColossusSegment = () => {
    const inst = instances[0]
    const segmentHp = inst?.segmentHp || {}
    const markedHp = segmentHp[segmentKey] || 0
    const toggleHpPip = (i) => {
      if (!inst || !onUpdate) return
      onUpdate(inst.id, { segmentHp: { ...segmentHp, [segmentKey]: i < markedHp ? i : i + 1 } })
    }
    return (
      <ColossusSegmentCard
        colossus={item} segment={segment} segmentKey={segmentKey} markedHp={markedHp}
        onToggleHpPip={toggleHpPip} onUpdate={onUpdate} onDelete={onDelete}
        getCardStyle={getCardStyle} quickEdit={quickEdit} setQuickEdit={setQuickEdit}
      />
    )
  }

  const renderExpandedColossus = () => {
    const colossus = item
    // Pull segmentHp from the single instance (colossi don't stack)
    const inst = instances[0]
    const segmentHp = inst?.segmentHp || {}
    const sortedSegments = sortSegments(colossus.segments)

    const SegmentBlock = ({ seg, instanceKey, markedHp }) => {
      const handlePipToggle = (pipIndex) => {
        if (!inst || !onUpdate) return
        const newMarked = pipIndex < markedHp ? pipIndex : pipIndex + 1
        onUpdate(inst.id, { segmentHp: { ...segmentHp, [instanceKey]: newMarked } })
      }
      const isDestroyed = markedHp >= (seg.hp || 0) && seg.hp
      const isBroken = !isDestroyed && seg.hp && markedHp >= Math.ceil((seg.hp || 0) / 2)

      return (
        <div style={{
          borderRadius: '0.375rem',
          border: `1px solid ${isDestroyed ? 'var(--danger)' : 'var(--border)'}`,
          padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
          opacity: isDestroyed ? 0.6 : 1,
          backgroundColor: isDestroyed ? 'color-mix(in srgb, var(--danger) 8%, transparent)' : 'transparent',
        }}>
          {/* Segment header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>
              {seg.name}
              {isDestroyed && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase' }}>Destroyed</span>}
              {!isDestroyed && isBroken && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: 'var(--warning, #f59e0b)', fontWeight: 600, textTransform: 'uppercase' }}>Broken</span>}
            </span>
            <div style={{ display: 'flex', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0, alignItems: 'center' }}>
              <span>Diff {seg.difficulty}</span>
              {seg.atk != null && <span>ATK +{seg.atk}</span>}
            </div>
          </div>
          {/* HP pips */}
          {seg.hp ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>HP</span>
              <HpPips max={seg.hp} marked={markedHp} onToggle={handlePipToggle} />
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.25rem' }}>Invulnerable</div>
          )}
          {/* Attack */}
          {seg.weapon && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {seg.weapon} · {seg.range} · {seg.damage}
            </div>
          )}
          {/* Features */}
          <FeatureList features={seg.features} />
        </div>
      )
    }

    return (
      <ContainerWithTab
        showTab={false}
        containerBackgroundColor={getCardStyle(true).backgroundColor}
        containerBorderColor='var(--border)'
        containerBorderRadius="0.5rem"
        containerOverflow="hidden"
        containerStyle={{
          padding: 0, height: 'auto',
          maxHeight: `calc(100vh - ${2 * DASHBOARD_GAP}px)`,
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Header */}
          <div className="border-b" style={{
            paddingTop: CARD_SPACE_V, paddingBottom: CARD_SPACE_V,
            paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H,
            flexShrink: 0, backgroundColor: 'var(--bg-card)',
            borderRadius: '0.5rem 0.5rem 0 0',
            position: 'relative',
          }}>
            {quickEdit ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete() }}
                    style={{
                      flexShrink: 0, width: '1.5rem', height: '1.5rem',
                      background: 'transparent', border: 'none', borderRadius: '0.25rem',
                      color: 'var(--danger)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                )}
                <input
                  type="text"
                  value={colossus.name || ''}
                  onChange={(e) => onUpdate && onUpdate(item.id, { name: e.target.value })}
                  style={{
                    flex: 1, minWidth: 0,
                    backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
                    borderRadius: '0.25rem', color: 'var(--text-primary)',
                    fontSize: '1rem', fontWeight: '600',
                    padding: '2px 6px',
                  }}
                  placeholder="Name"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setQuickEdit(false) }}
                  style={{
                    flexShrink: 0, width: '1.5rem', height: '1.5rem',
                    background: 'var(--purple)', border: 'none', borderRadius: '0.25rem',
                    color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                  title="Done editing"
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setQuickEdit(true) }}
                  style={{
                    position: 'absolute', right: CARD_SPACE_H, top: '50%', transform: 'translateY(-50%)', zIndex: 1,
                    width: '1.5rem', height: '1.5rem',
                    background: 'transparent', border: 'none', borderRadius: '0.25rem',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, transition: 'all 0.15s ease',
                  }}
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <h4 style={{
                  ...styles.rowTitle, margin: 0, fontSize: '1rem',
                  textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {colossus.name}
                </h4>
              </>
            )}
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="invisible-scrollbar">
            {/* Framework stats pill */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: `${CARD_SPACE_V} ${CARD_SPACE_H} 0` }}>
              <div style={{
                display: 'inline-flex', gap: '0.35rem', alignItems: 'center',
                fontSize: '0.75rem', backgroundColor: 'black',
                border: '1px solid var(--text-secondary)', borderRadius: '0.25rem',
                height: '1.5rem', padding: '0 10px', flexWrap: 'wrap',
              }}>
                <span style={{ color: 'white' }}>T{colossus.tier} Colossus</span>
                <span style={{ color: 'var(--text-secondary)' }}>·</span>
                <span style={{ color: 'white' }}>Major {colossus.thresholds?.major}</span>
                <span style={{ color: 'var(--text-secondary)' }}>/</span>
                <span style={{ color: 'white' }}>Severe {colossus.thresholds?.severe}</span>
              </div>
            </div>

            {/* Size + segments summary */}
            {(colossus.size || colossus.segmentsSummary) && (
              <div style={{ padding: `4px ${CARD_SPACE_H} 0`, textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {[colossus.size, colossus.segmentsSummary].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}

            {/* Stress pips */}
            {colossus.stress > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: CARD_SPACE_H, padding: `${CARD_SPACE_V} ${CARD_SPACE_H} 0` }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stress</span>
                <div style={{ display: 'flex', gap: '0.1875rem' }}>
                  {Array.from({ length: colossus.stress }, (_, i) => (
                    <div key={i} style={{
                      width: '0.75rem', height: '0.75rem', borderRadius: '50%',
                      border: '1.5px solid var(--text-secondary)',
                      backgroundColor: i < (inst?.stress || 0) ? 'var(--text-primary)' : 'transparent',
                      cursor: onUpdate && inst ? 'pointer' : 'default',
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      if (!inst || !onUpdate) return
                      const newStress = i < (inst.stress || 0) ? i : i + 1
                      onUpdate(inst.id, { stress: newStress })
                    }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Experiences */}
            {colossus.experience?.length > 0 && (
              <div style={{ padding: `${CARD_SPACE_V} ${CARD_SPACE_H} 0`, display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                {colossus.experience.map((e, i) => (
                  <span key={i} style={{
                    fontSize: '0.75rem', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)', borderRadius: '0.1875rem', padding: '1px 6px',
                  }}>
                    {e.name} +{e.modifier}
                  </span>
                ))}
              </div>
            )}

            {/* Framework features */}
            <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H }}>
              <FeatureList features={colossus.features} />
            </div>

            {/* Segments */}
            <div style={{ padding: `${CARD_SPACE_V} ${CARD_SPACE_H}` }}>
              <Divider title="Segments" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V, marginTop: CARD_SPACE_V }}>
                {sortedSegments.map(seg => {
                  const count = seg.count || 1
                  return Array.from({ length: count }, (_, idx) => {
                    const key = count > 1 ? `${seg.id}-${idx + 1}` : seg.id
                    const markedHp = segmentHp[key] || 0
                    return (
                      <SegmentBlock
                        key={key}
                        seg={seg}
                        instanceKey={key}
                        markedHp={markedHp}
                      />
                    )
                  })
                })}
              </div>
            </div>

            <div style={{ height: CARD_SPACE_V }} />
          </div>
        </div>
      </ContainerWithTab>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // When showCustomCreator is true, render CustomAdversaryCreator instead
  if (showCustomCreator && (type === 'adversary' || type === 'adversaries')) {
    const shouldShowTab = (type === 'adversary')
    
    const tabContent = shouldShowTab ? (
      // Tab buttons: Save and Cancel
      <>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (customCreatorRef.current?.handleSave) {
              customCreatorRef.current.handleSave()
            }
          }}
          style={{
            background: 'var(--purple)',
            border: '1px solid var(--purple)',
            color: 'white',
            borderRadius: '0.25rem',
            padding: '0.375rem 0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            fontSize: '0.85rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          title="Save"
        >
          <Check size={16} />
          <span>Save</span>
        </button>
        {onCancelEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCancelEdit()
            }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              borderRadius: '0.25rem',
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              e.currentTarget.style.borderColor = 'var(--purple)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
            title="Cancel"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
        )}
      </>
    ) : null

    return (
      <ContainerWithTab
        tabContent={tabContent}
        containerStyle={{
          padding: 0,
          height: 'auto',
          maxHeight: shouldShowTab ? `calc(100vh - ${2 * DASHBOARD_GAP + TAB_HEIGHT}px)` : `calc(100vh - ${2 * DASHBOARD_GAP}px)`,
          minHeight: 0
        }}
      >
        <CustomAdversaryCreator
          ref={customCreatorRef}
          editingAdversary={item}
          onSave={onSaveCustomAdversary}
          onCancelEdit={onCancelEdit}
          isStockAdversary={isStockAdversary}
          embedded={true}
          hideEmbeddedButtons={true} // Hide embedded buttons, use tab buttons instead
          allAdversaries={adversaries}
          autoFocus={!item.baseName || item.baseName.trim() === '' || item.baseName === 'Unknown'} // Auto-focus when creating new (empty baseName)
        />
      </ContainerWithTab>
    )
  }

  // Render environment card
  if (type === 'environment') {
    return renderExpandedEnvironment()
  }

  // Colossus: segment-per-card (global "segments" mode) or nested (default)
  if (item.isColossus) {
    return segment ? renderExpandedColossusSegment() : renderExpandedColossus()
  }

  // When showCustomCreator is true, use edit mode instead
  // This eliminates the double container issue
  const effectiveMode = showCustomCreator ? 'edit' : mode

  // Render expanded view for adversaries
  if ((effectiveMode === 'expanded' || effectiveMode === 'edit') && (type === 'adversary' || type === 'adversaries')) {
    return renderExpandedAdversary()
  }

  return null
}

export default GameCard
