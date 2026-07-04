import React from 'react'
import { inputStyle, labelStyle, sectionStyle, reorder, compactCtrlBtnStyle } from './customCreatorConstants'
import { DragHandle } from './creatorAtoms'
import { InfoPopover } from './InfoPopover'
import TouchTarget from '../Shared/TouchTarget'

// Drag-reorderable feature list (passives/actions/reactions) for the custom
// adversary creator. Extracted verbatim from CustomAdversaryCreator.jsx (Phase 4).
export const FeatureList = ({ featureType, label, formData, setFormData, dragFromRef, guideFeatures }) => {
  const allFeatures = formData.features || []
  const items = allFeatures.filter(f => f.type === featureType)
  const indices = allFeatures.reduce((acc, f, i) => { if (f.type === featureType) acc.push(i); return acc }, [])

  const addItem = () => setFormData(prev => ({ ...prev, features: [...(prev.features || []), { type: featureType, name: '', description: '' }] }))

  const addGuideFeature = (f) => setFormData(prev => ({
    ...prev,
    features: [...(prev.features || []), { type: featureType, name: f.name, description: f.desc || '' }]
  }))

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
        <label style={{ ...labelStyle, marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>{label}</label>
        <InfoPopover>
          {guideFeatures?.length > 0 ? (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Common {label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {guideFeatures.map((f, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.75rem' }}>{f.name}</span>
                      <button type="button" onClick={() => addGuideFeature(f)} style={{
                        padding: '0.2rem 0.5rem', minHeight: '36px', flexShrink: 0,
                        background: 'var(--purple)', border: 'none', borderRadius: '0.25rem',
                        color: 'white', fontSize: '0.75rem', cursor: 'pointer',
                      }}>Add</button>
                    </div>
                    {f.desc && <div style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>{f.desc}</div>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {featureType === 'Action' && 'Things the adversary does on its turn — attacks, abilities, special moves.'}
              {featureType === 'Passive' && 'Ongoing abilities that are always active and affect how the adversary works.'}
              {featureType === 'Reaction' && 'Abilities triggered by specific events, such as taking damage or an ally acting.'}
            </div>
          )}
        </InfoPopover>
        <button type="button" onClick={addItem} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.3rem 0.4rem', minWidth: '44px', minHeight: '44px' }} title={`Add ${label.slice(0, -1)}`}>+</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {items.map((feat, localIdx) => {
          const globalIdx = indices[localIdx]
          return (
            <div
              key={`${featureType}-${localIdx}`}
              draggable
              onDragStart={() => { dragFromRef.current = localIdx }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (dragFromRef.current === null) return
                const newItems = reorder(items, dragFromRef.current, localIdx)
                const order = ['Action', 'Passive', 'Reaction']
                const rebuilt = order.flatMap(t => t === featureType ? newItems : allFeatures.filter(f => f.type === t))
                setFormData(prev => ({ ...prev, features: rebuilt }))
                dragFromRef.current = null
              }}
              style={{ display: 'flex', gap: '0.4rem', alignItems: 'stretch', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '0.25rem', padding: '0.4rem 0.5rem' }}
            >
              <DragHandle />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                <input
                  type="text"
                  value={feat.name || ''}
                  onChange={e => {
                    const next = [...allFeatures]
                    next[globalIdx] = { ...next[globalIdx], name: e.target.value }
                    setFormData(prev => ({ ...prev, features: next }))
                  }}
                  placeholder={`${label.slice(0, -1)} name`}
                  style={{ ...inputStyle }}
                />
                <textarea
                  value={feat.description || ''}
                  onChange={e => {
                    const next = [...allFeatures]
                    next[globalIdx] = { ...next[globalIdx], description: e.target.value }
                    setFormData(prev => ({ ...prev, features: next }))
                  }}
                  placeholder="Description..."
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: '48px' }}
                />
              </div>
              <TouchTarget type="button" onClick={() => {
                const next = allFeatures.filter((_, i) => i !== globalIdx)
                setFormData(prev => ({ ...prev, features: next }))
              }} wrapperStyle={{ alignSelf: 'flex-start' }} style={compactCtrlBtnStyle(false)} visualSize={22} title={`Delete ${label.slice(0, -1).toLowerCase()}`}>×</TouchTarget>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FeatureList
