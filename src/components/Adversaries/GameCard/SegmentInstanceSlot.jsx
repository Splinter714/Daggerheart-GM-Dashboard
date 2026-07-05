import React from 'react'
import { Heart, Activity } from 'lucide-react'
import { StatCounter } from './StatusSection'
import { CARD_SPACE_H } from './constants'
import { formatInstanceLabel } from '../../Dashboard/hooks/useDashboardSortGroup'
import { getSegmentStatus, TokenCounter } from './ColossusSegmentCard'

// One instance slot within the consolidated segment-role card — rendered as
// a numbered instance mini-card in the exact same style as a regular
// adversary card's instance rows (numbered circle badge + HP/Stress
// StatCounter adjusters), per Jackson's playtest spec (#109). HP is
// segment-specific; Stress is the framework-shared colossus stress track
// (same `inst.stress` field every segment card reads/writes). Token counter
// renders below, independent per instance (#110).
// Extracted from ColossusSegmentCard.jsx to keep that file within its
// fitness file-size budget.
const SegmentInstanceSlot = ({
  seg, instanceKey, instanceNumber, markedHp, onToggleHpPip, tokenCount, onTokenChange,
  colossus, inst, onUpdate, instanceLabelStyle = 'numeric',
}) => {
  const { isDestroyed, isBroken } = getSegmentStatus(seg, markedHp)
  const hasTokens = tokenCount > 0
  const stressMax = colossus?.colossusStressMax || 0
  const stress = inst?.stress || 0

  return (
    <div>
      <div
        style={{
          backgroundColor: isDestroyed ? 'var(--gray-900)' : 'var(--bg-card)',
          borderRadius: '0.375rem',
          paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: CARD_SPACE_H,
          border: '1px solid',
          borderColor: isDestroyed ? 'var(--danger)' : 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          opacity: isDestroyed ? 0.7 : 1,
          position: 'relative',
          minHeight: '2.5rem',
        }}
      >
        {isDestroyed && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `repeating-linear-gradient(45deg, transparent 0px, transparent 8px, var(--gray-600) 9px, var(--gray-600) 9px)`,
            pointerEvents: 'none', zIndex: 1, borderRadius: '0.25rem',
          }} />
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 9px 1fr', alignItems: 'center', flex: 1, minWidth: 0, opacity: isDestroyed ? 0.3 : 1 }}>
          <div
            style={{
              backgroundColor: isDestroyed ? 'var(--gray-900)' : 'black',
              border: '1px solid',
              borderColor: isDestroyed ? 'color-mix(in srgb, var(--gray-600) 40%, transparent)' : 'white',
              borderRadius: '50%',
              minWidth: '1.5rem', height: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingTop: '0.0625rem', paddingLeft: '0.1875rem', paddingRight: '0.1875rem',
              flexShrink: 0, marginLeft: CARD_SPACE_H, marginRight: CARD_SPACE_H,
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isDestroyed ? 'var(--gray-400)' : 'white' }}>
              {formatInstanceLabel(instanceNumber, instanceLabelStyle)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {seg.hp ? (
              <StatCounter
                value={markedHp}
                max={seg.hp}
                Icon={Heart}
                iconColor="var(--text-secondary)"
                onDec={() => { if (markedHp > 0) onToggleHpPip(markedHp - 1) }}
                onInc={() => { if (markedHp < seg.hp) onToggleHpPip(markedHp) }}
              />
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Invulnerable</span>
            )}
          </div>
          <div style={{ width: '1px', height: '1.25rem', backgroundColor: 'var(--text-secondary)', justifySelf: 'center' }} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {stressMax > 0 && (
              <StatCounter
                value={stress}
                max={stressMax}
                Icon={Activity}
                iconColor="var(--text-secondary)"
                onDec={() => { if (stress > 0 && inst && onUpdate) onUpdate(inst.id, { stress: stress - 1 }) }}
                onInc={() => { if (stress < stressMax && inst && onUpdate) onUpdate(inst.id, { stress: stress + 1 }) }}
              />
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, marginTop: '0.25rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1, minWidth: 0 }}>
          {seg.name}{instanceNumber != null && ` #${instanceNumber}`}
          {isDestroyed && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase' }}>Destroyed</span>}
          {!isDestroyed && (isBroken || hasTokens) && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: 'var(--warning, #f59e0b)', fontWeight: 600, textTransform: 'uppercase' }}>Broken</span>}
        </span>
        <TokenCounter count={tokenCount} onChange={onTokenChange} />
      </div>
    </div>
  )
}

export default SegmentInstanceSlot
