import React, { useEffect, useRef, useState } from 'react'
import { inputStyle, labelStyle, sectionStyle } from '../Adversaries/customCreatorConstants'
import { FeatureList } from '../Adversaries/FeatureList'
import { InfoPopover } from '../Adversaries/InfoPopover'
import { PANEL_BORDER, PANEL_BORDER_RADIUS, PANEL_BOX_SHADOW } from '../Dashboard/constants'
import { ENVIRONMENT_TYPES, getDefaultDifficulty, getDefaultEnvironmentValues } from './environmentCreatorConstants'

// Custom environment creator (#102) — follows the CustomAdversaryCreator
// pattern (same form primitives: inputStyle/labelStyle/sectionStyle,
// FeatureList, InfoPopover) but as a single-column form, since environments
// have no combat stat block and don't need a live card preview pane.
const CustomEnvironmentCreator = ({
  onSave,
  onAddToEncounter,
  onCancelEdit,
  editingEnvironment = null,
  autoFocus = false,
}) => {
  const nameInputRef = useRef(null)
  const dragFromRef = useRef(null)

  const [formData, setFormData] = useState(() => {
    if (editingEnvironment) {
      return {
        ...getDefaultEnvironmentValues(),
        ...editingEnvironment,
        potentialAdversaries: editingEnvironment.potentialAdversaries || [],
        features: editingEnvironment.features || [],
      }
    }
    return getDefaultEnvironmentValues()
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => nameInputRef.current?.focus(), 300)
    }
  }, [autoFocus])

  const canAct = !isSaving && !!formData.name.trim()
  const disabledStyle = { opacity: 0.5, cursor: 'not-allowed' }

  const buildData = () => ({
    ...formData,
    name: formData.name.trim(),
    potentialAdversaries: (formData.potentialAdversaries || []).filter(Boolean),
  })

  const handleSave = async () => {
    if (!canAct) return
    setIsSaving(true)
    try {
      await onSave(buildData(), editingEnvironment?.id)
      onCancelEdit?.()
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddToEncounter = async () => {
    if (!canAct || !onAddToEncounter) return
    setIsSaving(true)
    try {
      await onAddToEncounter(buildData())
      onCancelEdit?.()
    } finally {
      setIsSaving(false)
    }
  }

  const setTier = (tier) => setFormData(prev => ({
    ...prev,
    tier,
    // Only replace difficulty with the new tier's default if it hadn't been
    // hand-edited away from the old tier's default.
    difficulty: prev.difficulty === getDefaultDifficulty(prev.tier) ? getDefaultDifficulty(tier) : prev.difficulty,
  }))

  const potentialAdversariesText = (formData.potentialAdversaries || []).join('\n')

  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
      border: PANEL_BORDER,
      borderRadius: PANEL_BORDER_RADIUS,
      boxShadow: PANEL_BOX_SHADOW,
    }}>
      <div style={{
        flex: '0 0 auto', display: 'flex', alignItems: 'center',
        padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', gap: '0.5rem',
      }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {editingEnvironment ? 'Edit Environment' : 'Create Environment'}
        </span>
        <div style={{ flex: 1 }} />
        {onCancelEdit && (
          <button onClick={onCancelEdit} style={{
            padding: '0.3rem 0.7rem', minHeight: '44px',
            background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.25rem',
            color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
          }}>Cancel</button>
        )}
        {!editingEnvironment && onAddToEncounter && (
          <button
            onClick={handleAddToEncounter}
            disabled={!canAct}
            style={{
              padding: '0.3rem 0.7rem', minHeight: '44px',
              background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.25rem',
              color: 'var(--text-primary)', fontSize: '0.85rem', cursor: canAct ? 'pointer' : 'not-allowed',
              ...(canAct ? {} : disabledStyle),
            }}
          >Add to Encounter</button>
        )}
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
        >{isSaving ? 'Saving…' : 'Save'}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          <div style={sectionStyle}>
            <label style={labelStyle}>Name</label>
            <input
              ref={nameInputRef}
              type="text" value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Environment name"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={sectionStyle}>
              <label style={labelStyle}>Tier</label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[1, 2, 3, 4].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    style={{
                      width: '38px', height: '38px', borderRadius: '0.25rem',
                      border: `1px solid ${formData.tier === t ? 'var(--purple)' : 'var(--border)'}`,
                      background: formData.tier === t ? 'var(--purple)' : 'var(--bg-secondary)',
                      color: formData.tier === t ? 'white' : 'var(--text-primary)',
                      fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div style={{ ...sectionStyle, flex: 1 }}>
              <label style={labelStyle}>Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {ENVIRONMENT_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                    style={{
                      padding: '0.4rem 0.6rem', minHeight: '38px', borderRadius: '0.25rem',
                      border: `1px solid ${formData.type === t ? 'var(--purple)' : 'var(--border)'}`,
                      background: formData.type === t ? 'color-mix(in srgb, var(--purple) 15%, transparent)' : 'var(--bg-secondary)',
                      color: formData.type === t ? 'var(--purple)' : 'var(--text-primary)',
                      fontSize: '0.8rem', cursor: 'pointer',
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                <span style={{ ...labelStyle, marginBottom: 0, lineHeight: 1 }}>Difficulty</span>
                <InfoPopover>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    The GM-facing roll difficulty PCs face when interacting with this environment. SRD guidance by tier: 1 → 10-12, 2 → 13-15, 3 → 16-18, 4 → 19-20.
                  </div>
                </InfoPopover>
              </div>
              <input
                type="number"
                value={formData.difficulty}
                onChange={e => setFormData(prev => ({ ...prev, difficulty: parseInt(e.target.value) || 0 }))}
                style={{ ...inputStyle, width: '90px' }}
              />
            </div>

            <div style={{ ...sectionStyle, flex: 1 }}>
              <label style={labelStyle}>Impulses</label>
              <input
                type="text" value={formData.impulses}
                onChange={e => setFormData(prev => ({ ...prev, impulses: e.target.value }))}
                placeholder="e.g. Draw in the curious, Echo the past"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What is this place, and what makes it notable?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: '72px' }}
            />
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
              <span style={{ ...labelStyle, marginBottom: 0, lineHeight: 1 }}>Potential Adversaries</span>
              <InfoPopover>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  One group per line, e.g. "Beasts (Bear, Dire Wolf, Glass Snake)".
                </div>
              </InfoPopover>
            </div>
            <textarea
              value={potentialAdversariesText}
              onChange={e => setFormData(prev => ({ ...prev, potentialAdversaries: e.target.value.split('\n') }))}
              placeholder={'One group per line, e.g.\nBeasts (Bear, Dire Wolf, Glass Snake)'}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: '52px' }}
            />
          </div>

          <FeatureList
            featureType="Action"
            label="Actions"
            formData={formData}
            setFormData={setFormData}
            dragFromRef={dragFromRef}
            guideFeatures={[]}
          />
          <FeatureList
            featureType="Passive"
            label="Passives"
            formData={formData}
            setFormData={setFormData}
            dragFromRef={dragFromRef}
            guideFeatures={[]}
          />
        </div>
      </div>
    </div>
  )
}

export default CustomEnvironmentCreator
