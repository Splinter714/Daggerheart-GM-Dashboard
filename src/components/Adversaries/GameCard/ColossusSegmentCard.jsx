import React from 'react'
import { Check, Pencil, X } from 'lucide-react'
import ContainerWithTab from '../../Dashboard/ContainerWithTab'
import MergedStatBadge from './MergedStatBadge'
import { CARD_SPACE_H, CARD_SPACE_V } from './constants'
import { DASHBOARD_GAP } from '../../Dashboard/constants'
import { highlightCardText } from './textHighlighter'
import TouchTarget from '../../Shared/TouchTarget'

// Renders a single colossus segment as its own standalone card, styled to
// match regular adversary card conventions (difficulty hex badge, ATK
// diamond badge, weapon pill) rather than the bespoke nested-list treatment.
// Used when the global "colossus display mode" setting is 'segments' (see
// useDashboardSortGroup.js / useEntityGroups.js).

// Segment role ordering — kept in sync with useEntityGroups.js so the
// "segments" and nested display modes list segments in the same order.
export const SEGMENT_ROLE_ORDER = {
  head: 1, neck: 2, torso: 3, body: 3, shell: 3, cavity: 3,
  arm: 4, claw: 4, wing: 4, foreleg: 5, hindleg: 6, leg: 6, talon: 6, tail: 7,
}

export const sortSegments = (segments) =>
  [...(segments || [])].sort((a, b) => {
    const ra = SEGMENT_ROLE_ORDER[a.role] ?? 99
    const rb = SEGMENT_ROLE_ORDER[b.role] ?? 99
    return ra !== rb ? ra - rb : (a.name || '').localeCompare(b.name || '')
  })

export const Divider = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, marginTop: CARD_SPACE_V }}>
    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {title}
    </span>
  </div>
)

export const FeatureList = ({ features }) => {
  if (!features?.length) return null
  const byType = ['Passive', 'Action', 'Reaction']
  return byType.map(ftype => {
    const fts = features.filter(f => f.type === ftype)
    if (!fts.length) return null
    return (
      <div key={ftype}>
        <Divider title={ftype + 's'} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V, marginTop: CARD_SPACE_V }}>
          {fts.map((f, i) => (
            <div key={i}>
              <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{f.name}</span>
              {f.description && (
                <div style={{ fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-secondary)', marginLeft: CARD_SPACE_H, marginTop: '0.125rem' }}>
                  {highlightCardText(f.description)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  })
}

// Individually-clickable HP pips — same interaction model as the nested view.
// Each pip's clickable area is expanded toward 44x44px via an invisible
// hit-area wrapper (negative margin pulls the tap zone back over neighbors)
// so the visual dot stays small and non-overlapping (#30 Priority 2).
export const HpPips = ({ max, marked, onToggle }) => {
  if (!max) return null
  return (
    <div style={{ display: 'flex', gap: '0.1875rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          onClick={e => { e.stopPropagation(); onToggle(i) }}
          style={{
            position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', margin: '-0.6875rem', flexShrink: 0, cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '0.75rem', height: '0.75rem', borderRadius: '50%',
              border: '1.5px solid var(--text-secondary)',
              backgroundColor: i < marked ? 'var(--text-primary)' : 'transparent',
              transition: 'background-color 0.1s',
              flexShrink: 0,
            }}
          />
        </span>
      ))}
    </div>
  )
}

// Shared Destroyed/Broken thresholds for a segment, used by both the nested
// (GameCard.jsx) and standalone (this file) segment renderings.
export const getSegmentStatus = (seg, markedHp) => {
  const isDestroyed = markedHp >= (seg.hp || 0) && !!seg.hp
  const isBroken = !isDestroyed && !!seg.hp && markedHp >= Math.ceil((seg.hp || 0) / 2)
  return { isDestroyed, isBroken }
}

const ColossusSegmentCard = ({
  colossus,
  segment: seg,
  segmentKey,
  markedHp,
  onToggleHpPip,
  onUpdate,
  onDelete,
  getCardStyle,
  quickEdit,
  setQuickEdit,
}) => {
  const { isDestroyed, isBroken } = getSegmentStatus(seg, markedHp)

  return (
    <ContainerWithTab
      showTab={false}
      containerBackgroundColor={getCardStyle(true).backgroundColor}
      containerBorderColor={isDestroyed ? 'var(--danger)' : 'var(--border)'}
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
                <TouchTarget
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  title="Remove colossus"
                  wrapperStyle={{ flexShrink: 0 }}
                  style={{ width: '1.5rem', height: '1.5rem', background: 'transparent', borderRadius: '0.25rem', color: 'var(--danger)' }}
                >
                  <X size={12} />
                </TouchTarget>
              )}
              <span style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {seg.name}
              </span>
              <TouchTarget
                onClick={(e) => { e.stopPropagation(); setQuickEdit(false) }}
                title="Done editing"
                wrapperStyle={{ flexShrink: 0 }}
                style={{ width: '1.5rem', height: '1.5rem', background: 'var(--purple)', borderRadius: '0.25rem', color: 'white' }}
              >
                <Check size={12} />
              </TouchTarget>
            </div>
          ) : (
            <>
              <TouchTarget
                onClick={(e) => { e.stopPropagation(); setQuickEdit(true) }}
                title="Edit"
                wrapperStyle={{ position: 'absolute', right: CARD_SPACE_H, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
                style={{ width: '1.5rem', height: '1.5rem', background: 'transparent', borderRadius: '0.25rem', color: 'var(--text-secondary)', transition: 'all 0.15s ease' }}
              >
                <Pencil size={12} />
              </TouchTarget>
              <h4 style={{
                margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)',
                textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.name}</span>
                {isDestroyed && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase' }}>Destroyed</span>}
                {!isDestroyed && isBroken && <span style={{ fontSize: '0.75rem', color: 'var(--warning, #f59e0b)', fontWeight: 600, textTransform: 'uppercase' }}>Broken</span>}
              </h4>
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="invisible-scrollbar">
          {/* Parent colossus pill, for context since this segment is its own card */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: `${CARD_SPACE_V} ${CARD_SPACE_H} 0` }}>
            <div style={{
              display: 'inline-flex', gap: '0.35rem', alignItems: 'center',
              fontSize: '0.75rem', backgroundColor: 'black',
              border: '1px solid var(--text-secondary)', borderRadius: '0.25rem',
              height: '1.5rem', padding: '0 10px',
            }}>
              <span style={{ color: 'white' }}>{colossus.name}</span>
              <span style={{ color: 'var(--text-secondary)' }}>·</span>
              <span style={{ color: 'white' }}>T{colossus.tier} Colossus</span>
            </div>
          </div>

          {/* Difficulty + ATK badges + weapon pill — matches regular adversary card conventions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, paddingTop: CARD_SPACE_V, paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H, flexWrap: 'wrap' }}>
            {seg.difficulty != null && (
              <MergedStatBadge shape="hex" label="DIFF" value={seg.difficulty} />
            )}
            {seg.atk != null && (
              <MergedStatBadge shape="diamond" label="ATK" value={seg.atk >= 0 ? `+${seg.atk}` : seg.atk} />
            )}
            {seg.weapon && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
                gap: '0.35rem', fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.3,
                backgroundColor: 'black', border: '1px solid var(--text-secondary)', borderRadius: '0.25rem',
                minHeight: '1.375rem', padding: '0.2rem 0.4rem', flex: 1, minWidth: 0,
              }}>
                <span style={{ color: 'white', overflowWrap: 'normal', textAlign: 'center' }}>{seg.weapon}</span>
                {seg.range && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: '1px', height: '1em', backgroundColor: 'var(--text-secondary)', flexShrink: 0 }} />
                    <span style={{ color: 'white' }}>{highlightCardText(seg.range)}</span>
                  </span>
                )}
                {seg.damage && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: '1px', height: '1em', backgroundColor: 'var(--text-secondary)', flexShrink: 0 }} />
                    <span style={{ color: 'white' }}>{highlightCardText(seg.damage)}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* HP pips */}
          <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H, paddingTop: CARD_SPACE_V }}>
            {seg.hp ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>HP</span>
                <HpPips max={seg.hp} marked={markedHp} onToggle={onToggleHpPip} />
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Invulnerable</div>
            )}
          </div>

          {/* Segment features */}
          <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H }}>
            <FeatureList features={seg.features} />
          </div>

          <div style={{ height: CARD_SPACE_V }} />
        </div>
      </div>
    </ContainerWithTab>
  )
}

export default ColossusSegmentCard
