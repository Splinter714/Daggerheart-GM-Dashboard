import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useLayoutEffect } from 'react'
import { Eye, X, Check, Plus } from 'lucide-react'
import GameCard from './GameCard'
import { AdversaryPreviewCard } from './AdversaryPreviewCard'
import FeaturesSection from './GameCard/FeaturesSection'
import ExperienceSection from './GameCard/ExperienceSection'
import { getDefaultAdversaryValues } from './adversaryDefaults'
import { typeGuide, stressFearGuide } from './adversaryTypeGuide'
import { DASHBOARD_GAP, PANEL_BORDER, PANEL_BORDER_RADIUS, PANEL_BOX_SHADOW } from '../Dashboard/constants'
import { inputStyle, labelStyle, sectionStyle, parseDamage, buildDamage, reorder, compactCtrlBtnStyle } from './customCreatorConstants'
import { DragHandle } from './creatorAtoms'
import { InfoPopover } from './InfoPopover'
import { StatField } from './StatField'
import { FeatureList } from './FeatureList'
import { TypeSelector } from './TypeSelector'
import { loadData, adversariesData } from './customAdversaryData'
import TouchTarget from '../Shared/TouchTarget'
import { ColossusSegmentEditor } from './ColossusSegmentEditor'
import { StandardAttackFields } from './StandardAttackFields'

// ─── Main component ──────────────────────────────────────────────────────────

const CustomAdversaryCreator = forwardRef(({
  onSave,
  onRefresh,
  onAddItem,
  onAddToEncounter,
  onSaveAndAdd,
  editingAdversary,
  onCancelEdit,
  isStockAdversary = false,
  autoFocus = false,
  allAdversaries = [],
  customAdversaries = [],
  embedded = false,
  hideEmbeddedButtons = false,
  columnWidth = null,
  contentTypeTabs = null, // Adversary/Environment switcher rendered in ActionBar (#102)
}, ref) => {
  const nameInputRef = useRef(null)
  const gameCardNameInputRef = useRef(null)
  const dragFromRef = useRef(null)

  const [formData, setFormData] = useState(() => {
    const defaults = getDefaultAdversaryValues(1, 'Standard')
    return {
      name: '', tier: 1, type: 'Standard',
      description: '', motives: '',
      difficulty: defaults.difficulty,
      thresholds: defaults.thresholds,
      hpMax: defaults.hpMax,
      stressMax: defaults.stressMax,
      atk: defaults.atk,
      weapon: '', range: defaults.range, damage: defaults.damage, damageType: 'Physical',
      experience: [], features: [], segments: [],
    }
  })

  const [isSaving, setIsSaving] = useState(false)
  const [statsPulledFromExisting, setStatsPulledFromExisting] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [adversaryData, setAdversaryData] = useState([])
  const [deleteConfirmations, setDeleteConfirmations] = useState({})

  // activeTab / isNarrow — only meaningful when !embedded, but hooks must be unconditional
  const [activeTab, setActiveTab] = useState('build')
  const containerRef = useRef(null)
  // Seed from window width so the first paint already has the correct layout (no flash)
  const [isNarrow, setIsNarrow] = useState(() => !embedded && window.innerWidth < 700)

  useEffect(() => {
    if (embedded) return
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 700)
    })
    observer.observe(el)
    setIsNarrow(el.offsetWidth < 700)
    return () => observer.disconnect()
  }, [embedded])

  // ── Data loading ────────────────────────────────────────────────────────────
  // Depend on value-stable keys, not array identities: callers may pass a fresh
  // array (or rely on the default []) every render, and since this effect calls
  // setAdversaryData with a new array, depending on identity would loop forever.
  const allAdvKey = (allAdversaries || []).map(a => a.id || a.name).join('|')
  const customAdvKey = (customAdversaries || []).map(a => a.id || a.name).join('|')
  useEffect(() => {
    const init = async () => {
      await loadData()
      const builtIn = allAdversaries.length > 0 ? allAdversaries : (adversariesData.adversaries || [])
      // Include the user's saved custom adversaries in autocomplete — listed first,
      // de-duped against built-ins by base name so an override doesn't appear twice.
      const baseName = (n) => (n || '').toLowerCase().replace(/\s+\(\d+\)$/, '')
      const customs = (customAdversaries || []).map(a => ({ ...a, __custom: true }))
      const customNames = new Set(customs.map(a => baseName(a.name)))
      const builtInFiltered = builtIn.filter(a => !customNames.has(baseName(a.name)))
      setAdversaryData([...customs, ...builtInFiltered])
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAdvKey, customAdvKey])

  // ── Auto-focus ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        if (editingAdversary && gameCardNameInputRef.current) {
          gameCardNameInputRef.current?.focus()
          gameCardNameInputRef.current?.select()
        } else if (nameInputRef.current) {
          nameInputRef.current?.focus()
        }
      }, 650)
    }
  }, [autoFocus, editingAdversary])

  // ── Initialize from editingAdversary ────────────────────────────────────────
  useEffect(() => {
    if (editingAdversary) {
      const baseName = editingAdversary.baseName || editingAdversary.name?.replace(/\s+\(\d+\)$/, '') || editingAdversary.name || ''
      const parsed = parseDamage(editingAdversary.damage || '')
      setFormData({
        name: baseName,
        tier: editingAdversary.tier || 1,
        type: editingAdversary.type || 'Standard',
        description: editingAdversary.description || '',
        motives: editingAdversary.motives || '',
        difficulty: editingAdversary.difficulty || 11,
        thresholds: editingAdversary.thresholds || { major: 7, severe: 12 },
        hpMax: editingAdversary.hpMax || 3,
        stressMax: editingAdversary.stressMax || 1,
        atk: editingAdversary.atk || 1,
        weapon: editingAdversary.weapon || '',
        range: editingAdversary.range || 'Melee',
        damage: parsed.dice || editingAdversary.damage || '',
        damageType: parsed.type || 'Physical',
        experience: editingAdversary.experience || [],
        features: editingAdversary.features || [],
        segments: editingAdversary.segments || [],
      })
      setStatsPulledFromExisting(false)
    } else {
      const defaults = getDefaultAdversaryValues(1, 'Standard')
      setFormData({
        name: '', tier: 1, type: 'Standard',
        description: '', motives: '',
        difficulty: defaults.difficulty,
        thresholds: defaults.thresholds,
        hpMax: defaults.hpMax, stressMax: defaults.stressMax,
        atk: defaults.atk, weapon: '', range: defaults.range, damage: defaults.damage, damageType: 'Physical',
        experience: [], features: [], segments: [],
      })
      setStatsPulledFromExisting(false)
    }
  }, [editingAdversary])

  // ── Handlers that batch tier/type changes with new defaults to avoid flicker ─
  const handleTierChange = useCallback((t) => {
    setFormData(prev => {
      if (!editingAdversary && !statsPulledFromExisting) {
        const d = getDefaultAdversaryValues(t, prev.type)
        const parsed = parseDamage(d.damage || '')
        return { ...prev, tier: t, difficulty: d.difficulty, thresholds: d.thresholds, hpMax: d.hpMax, stressMax: d.stressMax, atk: d.atk, range: d.range, damage: parsed.dice || d.damage, damageType: parsed.type || prev.damageType }
      }
      return { ...prev, tier: t }
    })
  }, [editingAdversary, statsPulledFromExisting])

  const handleTypeChange = useCallback((t) => {
    setFormData(prev => {
      if (!editingAdversary && !statsPulledFromExisting) {
        const d = getDefaultAdversaryValues(prev.tier, t)
        const parsed = parseDamage(d.damage || '')
        return { ...prev, type: t, difficulty: d.difficulty, thresholds: d.thresholds, hpMax: d.hpMax, stressMax: d.stressMax, atk: d.atk, range: d.range, damage: parsed.dice || d.damage, damageType: parsed.type || prev.damageType }
      }
      return { ...prev, type: t }
    })
  }, [editingAdversary, statsPulledFromExisting])

  // ── Autocomplete ────────────────────────────────────────────────────────────
  const handleNameChange = (value) => {
    setFormData(prev => ({ ...prev, name: value }))
    if (value.trim().length > 0) {
      const matches = adversaryData
        .filter(adv => {
          const base = adv.name?.replace(/\s+\(\d+\)$/, '') || adv.name || ''
          return base.toLowerCase().includes(value.toLowerCase())
        })
        .slice(0, 5)
      setNameSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setNameSuggestions([])
      setShowSuggestions(false)
      setStatsPulledFromExisting(false)
    }
  }

  // Task #5 fix: pull ALL fields from template adversary
  const handleSelectAdversary = (adv) => {
    const baseName = adv.baseName || adv.name?.replace(/\s+\(\d+\)$/, '') || adv.name || ''
    const parsed = parseDamage(adv.damage || '')
    setFormData(prev => ({
      ...prev,
      name: baseName,
      tier: adv.tier || prev.tier,
      type: adv.type || prev.type,
      description: adv.description || prev.description,
      motives: adv.motives || prev.motives,
      difficulty: adv.difficulty || prev.difficulty,
      thresholds: adv.thresholds || prev.thresholds,
      hpMax: adv.hpMax || prev.hpMax,
      stressMax: adv.stressMax || prev.stressMax,
      atk: adv.atk !== undefined ? adv.atk : prev.atk,
      weapon: adv.weapon || prev.weapon,
      range: adv.range || prev.range,
      damage: parsed.dice || adv.damage || prev.damage,
      damageType: parsed.type || 'Physical',
      experience: adv.experience ? [...adv.experience] : prev.experience,
      features: adv.features ? [...adv.features] : prev.features,
      segments: adv.segments ? [...adv.segments] : prev.segments,
    }))
    setStatsPulledFromExisting(true)
    setNameSuggestions([])
    setShowSuggestions(false)
    nameInputRef.current?.focus()
  }

  // ── Feature delete helpers (for form-level FeaturesSection) ─────────────────
  const getFeatureKey = (feature) => {
    const typeFeatures = (formData.features || []).filter(f => f.type === feature.type)
    const idx = typeFeatures.findIndex(f => f === feature)
    return `${feature.type}-${idx}-${feature.name || 'blank'}`
  }

  const handleFeatureDeleteClick = (featureToDelete) => {
    const key = getFeatureKey(featureToDelete)
    if (deleteConfirmations[key]) {
      setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== featureToDelete) }))
      setDeleteConfirmations(prev => { const n = { ...prev }; delete n[key]; return n })
    } else {
      setDeleteConfirmations(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setDeleteConfirmations(prev => { const n = { ...prev }; delete n[key]; return n }), 3000)
    }
  }

  // onUpdate adapter for FeaturesSection / ExperienceSection
  const handleFormUpdate = (_id, updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  // ── Save logic ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      const filterBlank = (exps) =>
        (exps || []).filter(e => (e.name && e.name.trim() !== '') || (e.modifier !== undefined && e.modifier !== 0))

      const baseName = formData.name.trim()
      const { damageType, ...formRest } = formData
      const data = {
        ...formRest,
        baseName,
        name: baseName,
        damage: buildDamage(formData.damage, damageType),
        experience: filterBlank(formData.experience),
        hp: editingAdversary ? editingAdversary.hp : 0,
        stress: editingAdversary ? editingAdversary.stress : 0,
        source: 'Homebrew',
        isColossus: formData.type === 'Colossus',
      }

      if (editingAdversary) {
        if (isStockAdversary) {
          const { id, name, ...dataToSave } = data
          await onSave(dataToSave)
        } else {
          await onSave({ ...data, name: data.baseName }, editingAdversary.id)
        }
        onCancelEdit?.()
      } else {
        await onSave(data)
        if (onRefresh) await onRefresh()
        const defaults = getDefaultAdversaryValues(1, 'Standard')
        setFormData({
          name: '', tier: 1, type: 'Standard',
          description: '', motives: '',
          difficulty: defaults.difficulty, thresholds: defaults.thresholds,
          hpMax: defaults.hpMax, stressMax: defaults.stressMax,
          atk: defaults.atk, weapon: '', range: defaults.range, damage: defaults.damage, damageType: 'Physical',
          experience: [], features: [], segments: [],
        })
        setStatsPulledFromExisting(false)
      }
    } catch (err) {
      console.error('Error saving adversary:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAs = async () => {
    if (!formData.name.trim()) return
    setIsSaving(true)
    try {
      const filterBlank = (exps) =>
        (exps || []).filter(e => (e.name && e.name.trim() !== '') || (e.modifier !== undefined && e.modifier !== 0))
      const baseName = formData.name.trim()
      const { damageType, ...formRest } = formData
      const data = {
        ...formRest, baseName, name: baseName,
        damage: buildDamage(formData.damage, damageType),
        experience: filterBlank(formData.experience),
        hp: 0, stress: 0, source: 'Homebrew',
        isColossus: formData.type === 'Colossus',
      }
      const { id, ...dataToSave } = data
      await onSave(dataToSave)
      onCancelEdit?.()
    } catch (err) {
      console.error('Error saving adversary as new:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndAdd = async () => {
    if (!formData.name.trim() || !onSaveAndAdd) return
    setIsSaving(true)
    try {
      const filterBlank = (exps) =>
        (exps || []).filter(e => (e.name && e.name.trim() !== '') || (e.modifier !== undefined && e.modifier !== 0))
      const baseName = formData.name.trim()
      const { damageType, ...formRest } = formData
      const data = {
        ...formRest, baseName, name: baseName,
        damage: buildDamage(formData.damage, damageType),
        experience: filterBlank(formData.experience),
        hp: 0, stress: 0, source: 'Homebrew',
        isColossus: formData.type === 'Colossus',
      }
      await onSaveAndAdd(data)
    } catch (err) {
      console.error('Error saving and adding adversary:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddToEncounter = async () => {
    if (!formData.name.trim() || !onAddToEncounter) return
    setIsSaving(true)
    try {
      const filterBlank = (exps) =>
        (exps || []).filter(e => (e.name && e.name.trim() !== '') || (e.modifier !== undefined && e.modifier !== 0))
      const baseName = formData.name.trim()
      const { damageType, ...formRest } = formData
      const data = {
        ...formRest, baseName, name: baseName,
        damage: buildDamage(formData.damage, damageType),
        experience: filterBlank(formData.experience),
        hp: 0, stress: 0, source: 'Homebrew',
        isColossus: formData.type === 'Colossus',
      }
      await onAddToEncounter(data)
      onCancelEdit?.()
    } catch (err) {
      console.error('Error adding adversary to encounter:', err)
    } finally {
      setIsSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({
    handleSave,
    isSaving,
    canSave: formData.name.trim().length > 0,
  }))

  // ─────────────────────────────────────────────────────────────────────────────
  // RESPONSIVE LAYOUT (embedded={false})
  // Narrow  (<760px): single panel, tabs to switch between Build / Preview / Guide
  // Wide   (≥760px): Build (flex:2) + visible side panels; tab pills toggle them
  // ─────────────────────────────────────────────────────────────────────────────

  if (!embedded) {
    const isMinion = formData.type === 'Minion'
    const isColossus = formData.type === 'Colossus'
    const guide = typeGuide[formData.type]

    const formItem = { ...formData, id: 'creator-form', hp: 0, stress: 0, source: 'Homebrew', name: formData.name || 'Name', weapon: formData.weapon || 'Attack', damage: buildDamage(formData.damage, formData.damageType), isColossus }
    const previewInstances = [{ ...formItem }]

    const canAct = !isSaving && !!formData.name.trim()
    const disabledStyle = { opacity: 0.5, cursor: 'not-allowed' }
    // Shared style for Cancel/Save As New/Add to Encounter — all equally-subordinate outline buttons.
    const desktopSecondaryBtnStyle = (enabled = true) => ({
      padding: '0.3rem 0.7rem', minHeight: '44px', background: 'transparent',
      border: '1px solid var(--border)', borderRadius: '0.25rem',
      color: 'var(--text-primary)', fontSize: '0.85rem', cursor: enabled ? 'pointer' : 'not-allowed',
      ...(enabled ? {} : disabledStyle),
    })

    const ActionBar = () => (
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', gap: '0.5rem' }}>
        {/* Preview toggle — narrow only */}
        {isNarrow && (
          <button
            onClick={() => setActiveTab(v => v === 'build' ? 'preview' : 'build')}
            style={{
              padding: '0.3rem 0.7rem', minHeight: '44px',
              background: activeTab === 'preview' ? 'color-mix(in srgb, var(--purple) 15%, transparent)' : 'transparent',
              border: `1px solid ${activeTab === 'preview' ? 'var(--purple)' : 'var(--border)'}`,
              borderRadius: '0.25rem',
              color: activeTab === 'preview' ? 'var(--purple)' : 'var(--text-secondary)',
              fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >{activeTab === 'preview' ? '← Build' : 'Preview'}</button>
        )}

        {contentTypeTabs}
        <div style={{ flex: 1 }} />

        {onCancelEdit && (
          <button onClick={onCancelEdit} style={desktopSecondaryBtnStyle()}>Cancel</button>
        )}

        {/* Save As New — only when editing a homebrew adversary */}
        {editingAdversary && !isStockAdversary && (
          <button onClick={handleSaveAs} disabled={!canAct} style={desktopSecondaryBtnStyle(canAct)}>Save As New</button>
        )}

        {/* Add to Encounter — only when creating new (not editing) */}
        {!editingAdversary && onAddToEncounter && (
          <button onClick={handleAddToEncounter} disabled={!canAct} style={desktopSecondaryBtnStyle(canAct)}>Add to Encounter</button>
        )}

        {/* Primary save button */}
        <button
          onClick={handleSave}
          disabled={!canAct}
          style={{
            padding: '0.3rem 0.9rem', minHeight: '44px',
            background: canAct ? 'var(--purple)' : 'var(--gray-600)',
            border: 'none', borderRadius: '0.25rem', color: 'white',
            fontSize: '0.85rem', fontWeight: '600',
            cursor: canAct ? 'pointer' : 'not-allowed',
            ...(canAct ? {} : disabledStyle),
          }}
        >
          {isSaving
            ? (editingAdversary ? (isStockAdversary ? 'Creating...' : 'Saving...') : 'Saving...')
            : (editingAdversary ? (isStockAdversary ? 'Save As Custom' : 'Save') : 'Save')}
        </button>
      </div>
    )

    const cardStyle = {
      flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
      border: PANEL_BORDER,
      borderRadius: PANEL_BORDER_RADIUS,
      boxShadow: PANEL_BOX_SHADOW,
    }

    const btnBase = {
      padding: '0.3rem 0.7rem', minHeight: '44px',
      borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer',
      flexShrink: 0, whiteSpace: 'nowrap',
    }

    // Icon + short-label buttons, sized to their natural content width (not
    // equal flex-division) so text is never clipped by ellipsis — each
    // button is only as wide as its icon + label need (#67). Save still
    // reads as dominant via bold + fill color, not extra forced width.
    const mobileBtnBase = {
      ...btnBase, padding: '0.4rem 0.5rem', minWidth: 0, flex: '0 1 auto', overflow: 'visible',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.78rem',
    }
    const mobileBtnLabel = { whiteSpace: 'nowrap' }
    const secondaryBtnStyle = mobileBtnBase
    const saveBtnStyle = mobileBtnBase
    const secondaryVisual = { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }

    const MobileActionBar = () => (
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', padding: '0.55rem 0.6rem', borderTop: '1px solid var(--border)', gap: '0.35rem' }}>
        <button
          onClick={() => setActiveTab(v => v === 'build' ? 'preview' : 'build')}
          style={{ ...secondaryBtnStyle, background: activeTab === 'preview' ? 'color-mix(in srgb, var(--purple) 15%, transparent)' : 'transparent', border: `1px solid ${activeTab === 'preview' ? 'var(--purple)' : 'var(--border)'}`, color: activeTab === 'preview' ? 'var(--purple)' : 'var(--text-secondary)' }}
        ><Eye size={14} style={{ flexShrink: 0 }} /><span style={mobileBtnLabel}>{activeTab === 'preview' ? 'Form' : 'Preview'}</span></button>

        {onCancelEdit && (
          <button onClick={onCancelEdit} style={{ ...secondaryBtnStyle, ...secondaryVisual }}>
            <X size={14} style={{ flexShrink: 0 }} /><span style={mobileBtnLabel}>Cancel</span>
          </button>
        )}
        {/* Save As New — only when editing a homebrew adversary, mirrors desktop ActionBar (#67) */}
        {editingAdversary && !isStockAdversary && (
          <button onClick={handleSaveAs} disabled={!canAct} style={{ ...secondaryBtnStyle, ...secondaryVisual, ...(canAct ? {} : disabledStyle) }}>
            <Plus size={14} style={{ flexShrink: 0 }} /><span style={mobileBtnLabel}>New</span></button>
        )}
        {onSaveAndAdd && (
          <button onClick={handleSaveAndAdd} disabled={!canAct} style={{ ...secondaryBtnStyle, ...secondaryVisual, ...(canAct ? {} : disabledStyle) }}>
            <Plus size={14} style={{ flexShrink: 0 }} /><span style={mobileBtnLabel}>{isSaving ? 'Saving…' : 'Add'}</span></button>
        )}
        <button
          onClick={handleSave}
          disabled={!canAct}
          style={{ ...saveBtnStyle, flex: '0 1 auto', marginLeft: 'auto', background: canAct ? 'var(--purple)' : 'var(--gray-600)', border: 'none', color: 'white', fontWeight: '700', ...(canAct ? {} : disabledStyle) }}
        ><Check size={14} style={{ flexShrink: 0 }} /><span style={mobileBtnLabel}>{isSaving ? 'Saving…' : 'Save'}</span></button>
      </div>
    )

    const formScrollContent = (
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

              {/* Name */}
              <div style={{ ...sectionStyle, position: 'relative' }}>
                <label style={labelStyle}>Name</label>
                <input
                  ref={nameInputRef}
                  type="text" value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Name — or search to import from existing"
                  style={inputStyle}
                />
                {showSuggestions && nameSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
                    borderTop: 'none', borderRadius: '0 0 0.375rem 0.375rem',
                    maxHeight: '180px', overflowY: 'auto', zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                    {nameSuggestions.map((adv, idx) => {
                      const base = adv.baseName || adv.name?.replace(/\s+\(\d+\)$/, '') || adv.name
                      return (
                        <div key={idx} onMouseDown={e => e.preventDefault()} onClick={() => handleSelectAdversary(adv)}
                          style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: idx < nameSuggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {base}
                            {adv.__custom && (
                              <span style={{ fontSize: '0.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--purple)', border: '1px solid var(--purple)', borderRadius: '0.25rem', padding: '0 0.25rem', lineHeight: 1.4 }}>Custom</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{adv.type} · Tier {adv.tier}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Tier + Type */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={sectionStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem', minHeight: '20px' }}>
                    <span style={{ ...labelStyle, marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>Tier</span>
                    <InfoPopover>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>PC Levels by Tier</div>
                      {[['1','1'],['2','2–4'],['3','5–7'],['4','8–10']].map(([t, lvls]) => (
                        <div key={t} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.15rem 0', color: parseInt(t) === formData.tier ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: parseInt(t) === formData.tier ? 600 : 400, backgroundColor: parseInt(t) === formData.tier ? 'color-mix(in srgb, var(--purple) 15%, transparent)' : 'transparent', borderRadius: '0.25rem', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>
                          <span>Lvl {lvls}</span><span>Tier {t}</span>
                        </div>
                      ))}
                    </InfoPopover>
                  </div>
                  <div style={{ display: 'flex' }}>
                    {[1, 2, 3, 4].map((t, i) => (
                      <button key={t} onClick={() => handleTierChange(t)} style={{
                        flex: 1, minWidth: '44px', height: '44px',
                        border: '1px solid var(--border)',
                        borderLeft: i > 0 ? 'none' : '1px solid var(--border)',
                        borderRadius: i === 0 ? '0.25rem 0 0 0.25rem' : i === 3 ? '0 0.25rem 0.25rem 0' : '0',
                        background: formData.tier === t ? 'var(--purple)' : 'var(--bg-secondary)',
                        color: formData.tier === t ? 'white' : 'var(--text-primary)',
                        fontWeight: formData.tier === t ? '700' : '400',
                        fontSize: '0.85rem', cursor: 'pointer',
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{ ...sectionStyle, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', minHeight: '20px', marginBottom: '0.3rem' }}>
                    <span style={{ ...labelStyle, marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>Type</span>
                  </div>
                  <TypeSelector selectedType={formData.type} onTypeChange={handleTypeChange} />
                </div>
              </div>

              {/* Attack + Difficulty — not applicable to Colossus (per-segment instead) */}
              {!isColossus && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <StatField label="Attack Modifier" field="atk" rangeKey="atk" formData={formData} setFormData={setFormData} adversaryType={formData.type} currentTier={formData.tier} />
                  <StatField label="Difficulty" field="difficulty" rangeKey="difficulty" formData={formData} setFormData={setFormData} adversaryType={formData.type} currentTier={formData.tier} />
                </div>
              )}

              {/* Standard Attack fields — 2×2 grid — not applicable to Colossus (per-segment instead) */}
              {!isColossus && (
                <StandardAttackFields formData={formData} setFormData={setFormData} guide={guide} />
              )}

              {/* Thresholds */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <StatField label="Major Threshold" field="thresholds" subfield="major" rangeKey="major" disabled={isMinion} formData={formData} setFormData={setFormData} adversaryType={formData.type} currentTier={formData.tier} />
                <StatField label="Severe Threshold" field="thresholds" subfield="severe" rangeKey="severe" disabled={isMinion} formData={formData} setFormData={setFormData} adversaryType={formData.type} currentTier={formData.tier} />
              </div>

              {/* HP + Stress — HP not applicable to Colossus (tracked per-segment instead) */}
              <div style={{ display: 'grid', gridTemplateColumns: isColossus ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                {!isColossus && (
                  <StatField label="HP" field="hpMax" rangeKey="hp" formData={formData} setFormData={setFormData} adversaryType={formData.type} currentTier={formData.tier} />
                )}
                <StatField label="Stress" field="stressMax" rangeKey="stress" formData={formData} setFormData={setFormData} adversaryType={formData.type} currentTier={formData.tier} />
              </div>

              {/* Segments — Colossus only */}
              {isColossus && (
                <ColossusSegmentEditor
                  segments={formData.segments}
                  onChange={segments => setFormData(prev => ({ ...prev, segments }))}
                />
              )}

              {/* Description + Motives */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={sectionStyle}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Appearance and background..." rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: '52px', fontFamily: 'inherit' }} />
                </div>
                <div style={sectionStyle}>
                  <label style={labelStyle}>Motives & Tactics</label>
                  <textarea value={formData.motives} onChange={e => setFormData(prev => ({ ...prev, motives: e.target.value }))} placeholder="What drives them, how they fight..." rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: '52px', fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* Experiences */}
              <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>Experiences</label>
                  <InfoPopover>
                    {guide?.experiences?.length > 0 ? (
                      <>
                        <div style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                          Suggested — Tier {formData.tier} (+{Math.min(formData.tier + 1, 3)})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {guide.experiences.map((exp, i) => (
                            <button key={i} type="button"
                              onClick={() => {
                                const bonus = Math.min(formData.tier + 1, 3)
                                setFormData(prev => ({ ...prev, experience: [...(prev.experience || []), { name: exp, modifier: bonus }] }))
                              }}
                              style={{
                                padding: '0.2rem 0.5rem',
                                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                borderRadius: '0.25rem', fontSize: '0.75rem',
                                color: 'var(--text-primary)', cursor: 'pointer',
                              }}>{exp}</button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Experiences represent things this adversary is particularly skilled at. Each experience has a name and a bonus modifier (+1 to +3) added to relevant rolls.
                      </div>
                    )}
                  </InfoPopover>
                  <button type="button" onClick={() => {
                    const bonus = Math.min(formData.tier + 1, 3)
                    setFormData(prev => ({ ...prev, experience: [...(prev.experience || []), { name: '', modifier: bonus }] }))
                  }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.3rem 0.4rem', minWidth: '44px', minHeight: '44px' }} title="Add experience">+</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {(formData.experience || []).map((exp, i) => {
                    const name = typeof exp === 'string' ? exp : (exp.name || '')
                    const modifier = typeof exp === 'object' ? (exp.modifier || 0) : 0
                    const setExp = (patch) => setFormData(prev => {
                      const next = [...(prev.experience || [])]
                      next[i] = { name, modifier, ...patch }
                      return { ...prev, experience: next }
                    })
                    return (
                      <div key={i} draggable onDragStart={() => { dragFromRef.current = i }} onDragOver={e => e.preventDefault()}
                        onDrop={() => { if (dragFromRef.current === null) return; setFormData(prev => ({ ...prev, experience: reorder(prev.experience, dragFromRef.current, i) })); dragFromRef.current = null }}
                        style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}
                      >
                        <DragHandle />
                        <input
                          type="text"
                          value={modifier > 0 ? `+${modifier}` : ''}
                          onChange={e => {
                            const raw = e.target.value.replace(/[^0-9+-]/g, '')
                            setExp({ modifier: Math.max(0, raw === '' || raw === '+' ? 0 : parseInt(raw) || 0) })
                          }}
                          onKeyDown={e => {
                            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
                            e.preventDefault()
                            setExp({ modifier: Math.max(0, modifier + (e.key === 'ArrowUp' ? 1 : -1)) })
                          }}
                          style={{ width: '24px', height: '24px', flexShrink: 0, border: '1px solid var(--text-secondary)', borderRadius: '4px', backgroundColor: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', outline: 'none' }}
                        />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setExp({ name: e.target.value })}
                          placeholder="Experience name"
                          style={{ ...inputStyle, flex: 1, fontSize: '0.85rem' }}
                        />
                        <TouchTarget type="button" onClick={() => {
                          const next = (formData.experience || []).filter((_, j) => j !== i)
                          setFormData(prev => ({ ...prev, experience: next }))
                        }} style={compactCtrlBtnStyle(false)} visualSize={22} title="Delete experience">×</TouchTarget>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Features */}
              <FeatureList
                featureType="Action" label="Actions"
                formData={formData} setFormData={setFormData} dragFromRef={dragFromRef}
                guideFeatures={guide?.features?.filter(f => f.type === 'Action')}
              />
              <FeatureList
                featureType="Passive" label="Passives"
                formData={formData} setFormData={setFormData} dragFromRef={dragFromRef}
                guideFeatures={guide?.features?.filter(f => f.type === 'Passive')}
              />
              <div style={{ paddingBottom: '1rem' }}>
                <FeatureList
                  featureType="Reaction" label="Reactions"
                  formData={formData} setFormData={setFormData} dragFromRef={dragFromRef}
                  guideFeatures={guide?.features?.filter(f => f.type === 'Reaction')}
                />
              </div>

            </div>
        </div>
    )

    // Live preview: see AdversaryPreviewCard (renders the actual dashboard
    // card component with a "Type: PREVIEW" pill, no boxed panel wrapper).
    const previewContent = <AdversaryPreviewCard formItem={formItem} previewInstances={previewInstances} />

    // Desktop panel mode: render two sibling absolute panels inside dashboard-main,
    // exactly like RightColumn but one for the form and one for the preview.
    if (columnWidth !== null) {
      const panelStyle = {
        position: 'absolute',
        top: `${DASHBOARD_GAP}px`,
        bottom: `${DASHBOARD_GAP}px`,
        width: `${columnWidth}px`,
        zIndex: 100,
        backgroundColor: 'var(--bg-primary)',
        border: PANEL_BORDER,
        borderRadius: PANEL_BORDER_RADIUS,
        boxShadow: PANEL_BOX_SHADOW,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }
      // Preview slot: same position/sizing as the boxed panel, but no
      // border/background/shadow — the live card sits directly in the column.
      const { backgroundColor, border, boxShadow, borderRadius, ...previewSlotStyle } = panelStyle
      return (
        <>
          <div style={{ ...previewSlotStyle, right: `${DASHBOARD_GAP + columnWidth + DASHBOARD_GAP}px` }}>
            {previewContent}
          </div>
          <div style={{ ...panelStyle, right: `${DASHBOARD_GAP}px` }}>
            {ActionBar()}
            {formScrollContent}
          </div>
        </>
      )
    }

    if (isNarrow) {
      return (
        <div ref={containerRef} className="adversary-creator" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
          {contentTypeTabs}
          {activeTab === 'build'
            ? formScrollContent
            : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{previewContent}</div>
          }
          {MobileActionBar()}
        </div>
      )
    }

    // Wide: preview sits unboxed, form keeps its card panel
    return (
      <div ref={containerRef} className="adversary-creator" style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', overflow: 'hidden', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {previewContent}
        </div>
        <div style={cardStyle}>
          {ActionBar()}
          {formScrollContent}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EMBEDDED LAYOUT (inside a GameCard via showCustomCreator)
  // ─────────────────────────────────────────────────────────────────────────────

  const mockAdversary = { ...formData, id: 'new-adversary', hp: 0, stress: 0, source: 'Homebrew' }

  return (
    <>
      {!hideEmbeddedButtons && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '0.5rem',
          padding: '0.5rem',
          borderBottom: '1px solid var(--border)',
          gap: '0.5rem',
        }}>
          {onCancelEdit && (
            <button
              onClick={onCancelEdit}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: '0.375rem', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: '600',
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isSaving || !formData.name.trim() ? 'var(--gray-600)' : 'var(--purple)',
              border: 'none', color: 'white', borderRadius: '0.375rem',
              cursor: isSaving || !formData.name.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem', fontWeight: '600',
              opacity: isSaving || !formData.name.trim() ? 0.6 : 1,
            }}
          >
            {isSaving
              ? (editingAdversary ? (isStockAdversary ? 'Creating...' : 'Saving...') : 'Saving...')
              : (editingAdversary ? (isStockAdversary ? 'Save As Custom' : 'Save') : 'Save')}
          </button>
        </div>
      )}

      {!editingAdversary && (
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <input
            ref={nameInputRef}
            type="text"
            value={formData.name}
            onChange={e => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Adversary name"
            style={{
              width: '100%', padding: '0.75rem',
              border: '1px solid var(--border)', borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
              fontSize: '1rem', outline: 'none',
            }}
          />
          {showSuggestions && nameSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0 0 0.5rem 0.5rem', borderTop: 'none',
              maxHeight: '200px', overflowY: 'auto',
              zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {nameSuggestions.map((adv, idx) => {
                const base = adv.baseName || adv.name?.replace(/\s+\(\d+\)$/, '') || adv.name
                return (
                  <div
                    key={idx}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelectAdversary(adv)}
                    style={{
                      padding: '0.75rem', cursor: 'pointer',
                      borderBottom: idx < nameSuggestions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ fontWeight: 600 }}>{base}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {adv.type} · Tier {adv.tier}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <GameCard
        item={mockAdversary}
        type="adversary"
        mode="edit"
        nameInputRef={editingAdversary ? gameCardNameInputRef : undefined}
        autoFocusNameInput={autoFocus && editingAdversary}
        onUpdate={(id, updates) => setFormData(prev => ({ ...prev, ...updates }))}
      />
    </>
  )
})

CustomAdversaryCreator.displayName = 'CustomAdversaryCreator'
export default CustomAdversaryCreator
