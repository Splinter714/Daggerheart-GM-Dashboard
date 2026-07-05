import React from 'react'
import { Heart, Activity } from 'lucide-react'
import Pips from '../../Shared/Pips'
import MergedStatBadge from './MergedStatBadge'
import { CARD_SPACE_H, CARD_SPACE_V } from './constants'
import { formatInstanceLabel } from '../../Dashboard/hooks/useDashboardSortGroup'
import ThresholdPill, { ThresholdLabel, ThresholdSep } from './ThresholdPill'
import MotivesExperienceRow from './MotivesExperience'

const StatusSection = ({
  item,
  instances = [],
  isEditMode,
  type,
  instanceColor,
  instanceLabelStyle = 'numeric', // Display-only label for the instance badge (#82)
  onUpdate,
  onApplyDamage,
  onApplyHealing,
  onApplyStressChange,
  onAddInstance,
  onRemoveInstance,
}) => {
  const shouldShowStatus =
    (instances && instances.length > 0) || (item.type === 'Minion' ? item.difficulty : (item.thresholds || isEditMode))
  if (!shouldShowStatus) return null

  const renderInstanceRow = (instance) => {
    const isInstanceDead = (instance.hp || 0) >= (instance.hpMax || 1)
    return (
      <div key={instance.id} data-instance-id={instance.id}>
        <div
          style={{
            backgroundColor: isInstanceDead ? 'var(--gray-900)' : 'var(--bg-card)',
            borderRadius: '0.375rem',
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: CARD_SPACE_H,
            border: '1px solid',
            borderColor: isInstanceDead ? 'color-mix(in srgb, var(--gray-600) 40%, transparent)' : 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            opacity: isInstanceDead ? 0.7 : 1,
            position: 'relative',
            transition: 'all 0.2s ease',
            minHeight: '2.5rem',
          }}
        >
          {isInstanceDead && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `repeating-linear-gradient(
                          45deg,
                          transparent 0px,
                          transparent 8px,
                          var(--gray-600) 9px,
                          var(--gray-600) 9px
                        )`,
                pointerEvents: 'none',
                zIndex: 1,
                borderRadius: '0.25rem',
              }}
            />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 9px 1fr', alignItems: 'center', flex: 1, minWidth: 0, opacity: isInstanceDead ? 0.3 : 1 }}>
            <div
              style={{
                backgroundColor: isInstanceDead ? 'var(--gray-900)' : (instanceColor || 'black'),
                border: '1px solid',
                borderColor: isInstanceDead ? 'color-mix(in srgb, var(--gray-600) 40%, transparent)' : 'white',
                borderRadius: '50%',
                minWidth: '1.5rem',
                height: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '0.0625rem',
                paddingLeft: '0.1875rem',
                paddingRight: '0.1875rem',
                flexShrink: 0,
                opacity: isInstanceDead ? 0.5 : 1,
                marginLeft: CARD_SPACE_H,
                marginRight: CARD_SPACE_H,
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isInstanceDead ? 'var(--gray-400)' : 'white' }}>
                {formatInstanceLabel(instance.duplicateNumber, instanceLabelStyle)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <StatCounter
                value={instance.hp || 0}
                max={instance.hpMax || 1}
                Icon={Heart}
                iconColor="var(--text-secondary)"
                onDec={() => { const hp = instance.hp || 0; if (hp > 0) onApplyHealing?.(instance.id, 1, hp) }}
                onInc={() => { const hp = instance.hp || 0; const max = instance.hpMax || 1; if (hp < max) onApplyDamage?.(instance.id, 1, hp, max) }}
              />
            </div>
            <div style={{ width: '1px', height: '1.25rem', backgroundColor: 'var(--text-secondary)', justifySelf: 'center' }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {instance.stressMax > 0 && (
                <StatCounter
                  value={instance.stress || 0}
                  max={instance.stressMax}
                  Icon={Activity}
                  iconColor="var(--text-secondary)"
                  onDec={() => { if ((instance.stress || 0) > 0) onApplyStressChange?.(instance.id, -1) }}
                  onInc={() => { if ((instance.stress || 0) < instance.stressMax) onApplyStressChange?.(instance.id, 1) }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderThresholds = () => {
    if (item.type === 'Minion') {
      if (!item.difficulty) return null
      const minionFeature = item.features?.find(f => /^Minion \(\d+\)$/i.test(f.name))
      const minionNum = minionFeature ? minionFeature.name.match(/\d+/)?.[0] : null
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H }}>
          {item.difficulty && <MergedStatBadge shape="hex" label="DIFF" value={item.difficulty} />}
          {minionNum && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.35rem', fontSize: '0.75rem', fontWeight: 400, lineHeight: 1,
              backgroundColor: 'black', border: '1px solid var(--text-secondary)',
              borderRadius: '0.25rem', padding: '0 0.4rem', height: '1.375rem', flex: 1,
            }}>
              <ThresholdLabel text="Minion" />
              <ThresholdSep />
              <span style={{ color: 'white' }}>{minionNum}</span>
            </div>
          )}
        </div>
      )
    }
    if (!item.thresholds && !isEditMode) return null
    if (isEditMode) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.25rem',
            padding: '0 0.375rem',
            height: '1.5rem',
            overflow: 'visible',
            alignSelf: 'center',
            width: 'fit-content',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem' }}>
            <ThresholdInput label="Minor" value={item.thresholds?.major} onChange={(val) => updateThreshold('major', val, onUpdate, item)} />
            <ThresholdInput label="Major" value={item.thresholds?.severe} onChange={(val) => updateThreshold('severe', val, onUpdate, item)} />
          </div>
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H }}>
        {item.difficulty && <MergedStatBadge shape="hex" label="DIFF" value={item.difficulty} />}
        <ThresholdPill major={item.thresholds?.major} severe={item.thresholds?.severe} />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: CARD_SPACE_V,
        paddingTop: CARD_SPACE_V,
        paddingLeft: CARD_SPACE_H,
        paddingRight: CARD_SPACE_H,
      }}
    >
      {(() => {
        const thresholdsEl = renderThresholds()
        if (!thresholdsEl) return null
        return thresholdsEl
      })()}
      {!isEditMode && <MotivesExperienceRow motives={item.motives} experience={item.experience} />}
      {isEditMode ? (
        <EditableVitals item={item} onUpdate={onUpdate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
          {[...instances]
            .sort((a, b) => (a.duplicateNumber || 1) - (b.duplicateNumber || 1))
            .map((instance) => renderInstanceRow(instance))}
        </div>
      )}
    </div>
  )
}

const EditableVitals = ({ item, onUpdate }) => (
  <div>
    <div
      style={{
        padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
        <VitalRow
          label="HP"
          pipType="adversaryHP"
          value={item.hpMax || ''}
          onChange={(value) => onUpdate && onUpdate(item.id, { hpMax: value })}
        />
        <VitalRow
          label="Stress"
          pipType="adversaryStress"
          value={item.stressMax || ''}
          onChange={(value) => onUpdate && onUpdate(item.id, { stressMax: value })}
        />
      </div>
    </div>
  </div>
)

const VitalRow = ({ label, pipType, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H }}>
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const parsed = parseInt(e.target.value) || 1
        onChange(parsed)
      }}
      min="1"
      max="99"
      style={{
        width: '2.5rem',
        padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
        border: '1px solid var(--border)',
        borderRadius: '0.25rem',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: '0.85rem',
        textAlign: 'center',
      }}
    />
    <Pips type={pipType} value={0} maxValue={value || 1} showTooltip={false} />
    <span
      style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        minWidth: '2.5rem',
      }}
    >
      {label}
    </span>
  </div>
)

// Exported so colossus segment cards (#109) can render HP/Stress adjusters
// in the exact same numbered-instance-row style as regular adversary cards.
export const StatCounter = ({ value, max, Icon, iconColor, onDec, onInc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
    <button onClick={onDec} style={counterBtnStyle}>−</button>
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', minWidth: '2.5rem', justifyContent: 'center', fontVariantNumeric: 'tabular-nums' }}>
      <Icon size={14} strokeWidth={1.25} color={iconColor} />
      <span style={{ display: 'inline-block', minWidth: '1ch', textAlign: 'right' }}>{value}</span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/ <span style={{ display: 'inline-block', minWidth: '1ch' }}>{max}</span></span>
    </span>
    <button onClick={onInc} style={counterBtnStyle}>+</button>
  </div>
)

const counterBtnStyle = {
  width: '32px', height: '44px', padding: 0, flexShrink: 0,
  border: 'none', backgroundColor: 'transparent', color: 'var(--text-secondary)',
  fontSize: '1.1rem', lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const ThresholdInput = ({ label, value, onChange }) => (
  <>
    <ThresholdLabel text={label} />
    <input
      type="number"
      min="1"
      max="99"
      value={value || ''}
      onChange={(e) => {
        const inputValue = e.target.value
        if (inputValue === '' || (parseInt(inputValue) >= 1 && parseInt(inputValue) <= 99)) {
          onChange(inputValue === '' ? null : parseInt(inputValue))
        }
      }}
      style={{
        width: '1.875rem',
        padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
        border: '1px solid var(--border)',
        borderRadius: '0.25rem',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: '0.75rem',
        textAlign: 'center',
      }}
    />
  </>
)

const updateThreshold = (field, value, onUpdate, item) => {
  onUpdate &&
    onUpdate(item.id, {
      thresholds: { ...item.thresholds, [field]: value },
    })
}

export default StatusSection

