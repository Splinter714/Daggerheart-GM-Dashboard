import React from 'react'
import { inputStyle, labelStyle, sectionStyle, DAMAGE_TYPES } from './customCreatorConstants'
import { InfoPopover } from './InfoPopover'
import { DamageSelector, selectArrowBg } from './DamageSelector'

// Standard-attack 2x2 grid (weapon/range/damage/damage-type) for the custom
// adversary creator. Extracted out of CustomAdversaryCreator.jsx (#98) to make
// room for the Colossus segment editor without pushing the file over its
// grandfathered line budget — behavior is unchanged from the inline version.
export const StandardAttackFields = ({ formData, setFormData, guide }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '20px', marginBottom: '0.3rem' }}>
        <span style={{ ...labelStyle, marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>Standard Attack</span>
      </div>
      <input type="text" value={formData.weapon} onChange={e => setFormData(prev => ({ ...prev, weapon: e.target.value }))} placeholder="e.g. Greataxe" style={{ ...inputStyle, minHeight: '44px' }} />
    </div>
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '20px', marginBottom: '0.3rem' }}>
        <span style={{ ...labelStyle, marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>Range</span>
      </div>
      <select value={formData.range} onChange={e => setFormData(prev => ({ ...prev, range: e.target.value }))} style={{ ...inputStyle, minHeight: '44px', appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.65rem center', paddingRight: '2rem' }}>
        {['Melee', 'Very Close', 'Close', 'Far', 'Very Far'].map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem', minHeight: '20px' }}>
        <span style={{ ...labelStyle, marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>Damage</span>
        <span style={{ visibility: guide?.damageDie ? 'visible' : 'hidden', display: 'flex', alignItems: 'center' }}>
          <InfoPopover align="right">
            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Damage Die</div>
            <div>{guide?.damageDie}</div>
          </InfoPopover>
        </span>
      </div>
      <DamageSelector
        damage={formData.damage}
        type={formData.type}
        tier={formData.tier}
        onChange={v => setFormData(prev => ({ ...prev, damage: v }))}
      />
    </div>
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '20px', marginBottom: '0.3rem' }}>
        <span style={{ ...labelStyle, marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>Damage Type</span>
      </div>
      <select
        value={formData.damageType || 'Physical'}
        onChange={e => setFormData(prev => ({ ...prev, damageType: e.target.value }))}
        style={{ ...inputStyle, minHeight: '44px', appearance: 'none', WebkitAppearance: 'none', backgroundImage: selectArrowBg, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.65rem center', paddingRight: '2rem' }}
      >
        {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  </div>
)

export default StandardAttackFields
