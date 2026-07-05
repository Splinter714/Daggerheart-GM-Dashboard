import React from 'react'
import { generateId } from '../../state/StorageHelpers'
import { inputStyle, labelStyle, sectionStyle, compactCtrlBtnStyle } from './customCreatorConstants'
import { DragHandle } from './creatorAtoms'

// Segment-editing UI for the "Colossus" adversary type (#98). Extracted into
// its own module because CustomAdversaryCreator.jsx is already at its
// grandfathered line budget. Produces `segments` data shaped exactly like
// src/components/Adversaries/colossi.json entries, so it's compatible with
// GameCard/ColossusSegmentCard's rendering (nested and separate-card modes)
// and useAdversaryState's initSegmentHp/createAdversary.

// Sort-order roles from colossi.json's segmentRoleOrder — used both to
// suggest a role for new segments and to keep the picker's options ordered.
export const SEGMENT_ROLES = [
  'head', 'neck', 'torso', 'body', 'shell', 'cavity',
  'arm', 'claw', 'wing', 'foreleg', 'hindleg', 'leg', 'talon', 'tail',
]

const emptySegment = () => ({
  id: generateId('seg'),
  name: '',
  role: 'torso',
  count: 1,
  adjacentSegments: [],
  difficulty: 14,
  hp: 3,
  atk: null,
  weapon: '',
  range: 'Melee',
  damage: '',
  features: [],
})

const numOrNull = (v) => (v === '' ? null : (parseInt(v, 10) || 0))

const SegmentFeatureList = ({ segment, onChange }) => {
  const features = segment.features || []
  const addFeature = (type) => onChange({ features: [...features, { type, name: '', description: '' }] })
  const updateFeature = (idx, patch) => {
    const next = [...features]
    next[idx] = { ...next[idx], ...patch }
    onChange({ features: next })
  }
  const removeFeature = (idx) => onChange({ features: features.filter((_, i) => i !== idx) })

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Features</label>
        {['Action', 'Passive', 'Reaction'].map(t => (
          <button key={t} type="button" onClick={() => addFeature(t)} style={{
            padding: '0.15rem 0.4rem', minHeight: '28px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '0.25rem', fontSize: '0.7rem', color: 'var(--text-primary)', cursor: 'pointer',
          }}>+ {t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {features.map((feat, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'stretch', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '0.25rem', padding: '0.4rem 0.5rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', flexShrink: 0, minWidth: '52px' }}>{feat.type}</span>
                <input
                  type="text" value={feat.name || ''}
                  onChange={e => updateFeature(i, { name: e.target.value })}
                  placeholder="Feature name"
                  style={inputStyle}
                />
              </div>
              <textarea
                value={feat.description || ''}
                onChange={e => updateFeature(i, { description: e.target.value })}
                placeholder="Description..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: '48px' }}
              />
            </div>
            <button type="button" onClick={() => removeFeature(i)} style={{ ...compactCtrlBtnStyle(false), alignSelf: 'flex-start' }} title="Delete feature">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const SegmentCard = ({ segment, index, onChange, onRemove, onMove, canMoveUp, canMoveDown }) => {
  const patch = (p) => onChange(index, p)

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <DragHandle />
        <input
          type="text" value={segment.name}
          onChange={e => patch({ name: e.target.value })}
          placeholder="Segment name (e.g. Head)"
          style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
        />
        <button type="button" onClick={() => onMove(-1)} disabled={!canMoveUp} style={{ ...compactCtrlBtnStyle(!canMoveUp) }} title="Move up">↑</button>
        <button type="button" onClick={() => onMove(1)} disabled={!canMoveDown} style={{ ...compactCtrlBtnStyle(!canMoveDown) }} title="Move down">↓</button>
        <button type="button" onClick={onRemove} style={compactCtrlBtnStyle(false)} title="Delete segment">×</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
        <div style={sectionStyle}>
          <label style={labelStyle}>Role</label>
          <select
            value={segment.role}
            onChange={e => patch({ role: e.target.value })}
            style={{ ...inputStyle, minHeight: '40px' }}
          >
            {SEGMENT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Count</label>
          <input
            type="number" min={1}
            value={segment.count === '' ? '' : (segment.count ?? 1)}
            onChange={e => {
              const raw = e.target.value
              if (raw === '') { patch({ count: '' }); return }
              const parsed = parseInt(raw, 10)
              if (Number.isNaN(parsed)) return
              patch({ count: parsed })
            }}
            onBlur={e => {
              if (e.target.value === '') { patch({ count: 1 }); return }
              patch({ count: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }}
            style={{ ...inputStyle, minHeight: '40px' }}
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Difficulty</label>
          <input
            type="number" value={segment.difficulty ?? ''}
            onChange={e => patch({ difficulty: numOrNull(e.target.value) })}
            style={{ ...inputStyle, minHeight: '40px' }}
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>HP (blank = invulnerable)</label>
          <input
            type="number" value={segment.hp ?? ''}
            onChange={e => patch({ hp: numOrNull(e.target.value) })}
            style={{ ...inputStyle, minHeight: '40px' }}
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>ATK (blank = no attack)</label>
          <input
            type="number" value={segment.atk ?? ''}
            onChange={e => patch({ atk: numOrNull(e.target.value) })}
            style={{ ...inputStyle, minHeight: '40px' }}
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Range</label>
          <select
            value={segment.range || 'Melee'}
            onChange={e => patch({ range: e.target.value })}
            style={{ ...inputStyle, minHeight: '40px' }}
          >
            {['Melee', 'Very Close', 'Close', 'Far', 'Very Far'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Weapon</label>
          <input
            type="text" value={segment.weapon || ''}
            onChange={e => patch({ weapon: e.target.value })}
            placeholder="e.g. Peck"
            style={{ ...inputStyle, minHeight: '40px' }}
          />
        </div>
        <div style={sectionStyle}>
          <label style={labelStyle}>Damage</label>
          <input
            type="text" value={segment.damage || ''}
            onChange={e => patch({ damage: e.target.value })}
            placeholder="e.g. 1d10+1 phy"
            style={{ ...inputStyle, minHeight: '40px', fontFamily: 'monospace' }}
          />
        </div>
      </div>

      <SegmentFeatureList segment={segment} onChange={patch} />
    </div>
  )
}

// Main segment-list editor: add/remove/reorder segments, edit each segment's
// fields inline. `segments` / `onChange(segments)` follow the same
// controlled-array pattern as FeatureList's formData/setFormData usage.
export const ColossusSegmentEditor = ({ segments, onChange }) => {
  const list = segments || []
  const dragFromRef = React.useRef(null)

  const addSegment = () => onChange([...list, emptySegment()])
  const updateSegment = (idx, patch) => {
    const next = [...list]
    next[idx] = { ...next[idx], ...patch }
    onChange(next)
  }
  const removeSegment = (idx) => onChange(list.filter((_, i) => i !== idx))
  const moveSegment = (idx, delta) => {
    const to = idx + delta
    if (to < 0 || to >= list.length) return
    const next = [...list]
    const [item] = next.splice(idx, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Segments</label>
        <button type="button" onClick={addSegment} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.3rem 0.4rem', minWidth: '44px', minHeight: '44px' }} title="Add segment">+</button>
      </div>
      {list.length === 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          No segments yet — add one to start building this colossus (e.g. Head, Torso, Legs).
        </div>
      )}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        onDragOver={e => e.preventDefault()}
      >
        {list.map((seg, i) => (
          <div
            key={seg.id}
            draggable
            onDragStart={() => { dragFromRef.current = i }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              if (dragFromRef.current === null) return
              const from = dragFromRef.current
              dragFromRef.current = null
              if (from === i) return
              const next = [...list]
              const [item] = next.splice(from, 1)
              next.splice(i, 0, item)
              onChange(next)
            }}
          >
            <SegmentCard
              segment={seg}
              index={i}
              onChange={updateSegment}
              onRemove={() => removeSegment(i)}
              onMove={(delta) => moveSegment(i, delta)}
              canMoveUp={i > 0}
              canMoveDown={i < list.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export const createEmptySegment = emptySegment

export default ColossusSegmentEditor
