import React from 'react'
import { Check, Pencil, X, Minus, Plus, Circle } from 'lucide-react'
import ContainerWithTab from '../../Dashboard/ContainerWithTab'
import MergedStatBadge from './MergedStatBadge'
import ColossusFrameworkInfo, { ColossusThresholdsBadge, ColossusStress } from './ColossusFrameworkInfo'
import SegmentInstanceSlot from './SegmentInstanceSlot'
import SectionHeader from './SectionHeader'
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

// Expands a colossus's segments (respecting each segment's `count`) into a
// flat, running-numbered list in `sortSegments` order — e.g. Head=1, Torso=2,
// Arm A=3, Arm B=4, Leg A=5, Leg B=6 (#109). The number is shared across the
// whole colossus rather than restarting per segment role, so it can be used
// as a stable, human-readable "instance number" in both the nested
// (GameCard.jsx) and standalone (this file) segment card headers.
export const numberSegmentInstances = (segments) =>
  sortSegments(segments).flatMap((seg) => {
    const count = seg.count || 1
    return Array.from({ length: count }, (_, idx) => ({ seg, idx, count }))
  }).map((entry, i) => ({
    ...entry,
    instanceKey: entry.count > 1 ? `${entry.seg.id}-${entry.idx + 1}` : entry.seg.id,
    instanceNumber: i + 1,
  }))

// Shared with adversary and environment cards (#100/#109) — see SectionHeader.jsx.
// Callers here add their own marginTop wrapper via this thin wrapper to
// preserve existing spacing at call sites (Divider was previously used with
// an implicit marginTop baked in, unlike the adversary/environment version).
export const Divider = ({ title }) => (
  <div style={{ marginTop: CARD_SPACE_V }}>
    <SectionHeader title={title} />
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

// Segment-specific features plus framework-wide features (e.g. "Colossal
// Power"), clearly distinguished with their own divider/section since both
// now appear together on the same self-contained segment card (#109).
export const SegmentFeatures = ({ segmentFeatures, frameworkFeatures }) => (
  <>
    <FeatureList features={segmentFeatures} />
    {frameworkFeatures?.length > 0 && (
      <div>
        <Divider title="Colossus Features" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V, marginTop: CARD_SPACE_V }}>
          {frameworkFeatures.map((f, i) => (
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
    )}
  </>
)

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

// Token tracker — some colossus segments carry a "place a token" / "Broken
// until all tokens are cleared" mechanic driven by feature text (e.g.
// Daktadae's Head, Forelegs, Hindlegs — see colossi.json). Tokens have no
// fixed max in the data (features place/clear them one at a time), so this
// is a simple GM-tracked counter rather than a pip row (#97). Token state
// always keys off the underlying colossus instance id, consistent across
// both display modes.
// Tooltip text explaining the mechanic (#97) — Jackson's playtest feedback
// was "what even are these tokens? I don't get it", so the label itself
// carries a native title tooltip on hover explaining what tokens track.
const TOKENS_TOOLTIP = 'This segment counts as Broken until all tokens are cleared.'

export const TokenCounter = ({ count, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
    <span
      style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0, cursor: 'help', borderBottom: '1px dotted var(--text-secondary)' }}
      title={TOKENS_TOOLTIP}
    >
      Tokens
    </span>
    <button
      onClick={e => { e.stopPropagation(); onChange(Math.max(0, count - 1)) }}
      style={tokenBtnStyle}
      title="Remove a token"
    >
      <Minus size={11} />
    </button>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 600, color: count > 0 ? 'var(--warning, #f59e0b)' : 'var(--text-secondary)', minWidth: '1.25rem', justifyContent: 'center' }}>
      <Circle size={9} fill="currentColor" stroke="none" />
      {count}
    </span>
    <button
      onClick={e => { e.stopPropagation(); onChange(count + 1) }}
      style={tokenBtnStyle}
      title="Place a token"
    >
      <Plus size={11} />
    </button>
  </div>
)

const tokenBtnStyle = {
  width: '1.125rem', height: '1.125rem', padding: 0, flexShrink: 0,
  border: '1px solid var(--text-secondary)', borderRadius: '0.2rem',
  background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

// One segment's block within the nested (default) colossus card — the
// bespoke list-item treatment used when colossusDisplayMode is 'nested'.
// Lives here (rather than GameCard.jsx) to keep that file within its size
// budget; extracted alongside the standalone ColossusSegmentCard so both
// segment renderings share the HP-pip/token/status helpers above.
export const NestedSegmentBlock = ({ seg, instanceKey, instanceNumber, markedHp, tokenCount, inst, colossus, onUpdate }) => {
  const handlePipToggle = (pipIndex) => {
    if (!inst || !onUpdate) return
    const newMarked = pipIndex < markedHp ? pipIndex : pipIndex + 1
    onUpdate(inst.id, { segmentHp: { ...(inst.segmentHp || {}), [instanceKey]: newMarked } })
  }
  const handleTokenChange = (count) => {
    if (!inst || !onUpdate) return
    onUpdate(inst.id, { segmentTokens: { ...(inst.segmentTokens || {}), [instanceKey]: count } })
  }
  const { isDestroyed, isBroken } = getSegmentStatus(seg, markedHp)
  const hasTokens = tokenCount > 0

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
          {seg.name}{instanceNumber != null && ` #${instanceNumber}`}
          {isDestroyed && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase' }}>Destroyed</span>}
          {!isDestroyed && (isBroken || hasTokens) && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: 'var(--warning, #f59e0b)', fontWeight: 600, textTransform: 'uppercase' }}>Broken</span>}
        </span>
        <div style={{ display: 'flex', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0, alignItems: 'center' }}>
          <span>Diff {seg.difficulty}</span>
          {seg.atk != null && <span>ATK +{seg.atk}</span>}
          {colossus?.thresholds && <span>Thresh {colossus.thresholds.major}/{colossus.thresholds.severe}</span>}
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
      {/* Token tracker — "Broken until cleared" mechanic (#97) */}
      <div style={{ marginBottom: '0.25rem' }}>
        <TokenCounter count={tokenCount} onChange={handleTokenChange} />
      </div>
      {/* Framework-shared info (Motives, Experience, Stress) — repeated on
          every segment card so each is self-contained (#109) */}
      {colossus && (
        <div style={{ marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
          <ColossusFrameworkInfo colossus={colossus} />
          <ColossusStress colossus={colossus} inst={inst} onUpdate={onUpdate} />
        </div>
      )}
      {/* Segment-specific features only. Framework-wide features (e.g.
          "Colossal Power") are shown once at the top-level colossus card in
          Nested mode (GameCard.jsx renders colossus.features via FeatureList
          there) — this block must NOT repeat them or they'd duplicate on
          every segment (#118). This is distinct from the Segments
          (standalone) display mode's ColossusSegmentCard, which intentionally
          repeats framework features on every self-contained segment card
          (#109) via its own separate SegmentFeatures call. */}
      <FeatureList features={seg.features} />
    </div>
  )
}

// SegmentInstanceSlot (the numbered instance mini-card with HP/Stress
// adjusters, #109) lives in ./SegmentInstanceSlot.jsx — extracted to keep
// this file within its fitness file-size budget.

const ColossusSegmentCard = ({
  colossus,
  segment: seg,
  slots,
  inst,
  onUpdate,
  onDelete,
  getCardStyle,
  quickEdit,
  setQuickEdit,
}) => {
  // Card-level status badge reflects whether ANY instance slot is
  // destroyed/broken, so the header still surfaces at-a-glance state.
  const anyDestroyed = (slots || []).some(s => getSegmentStatus(seg, s.markedHp).isDestroyed)
  const anyBroken = (slots || []).some(s => {
    const { isDestroyed, isBroken } = getSegmentStatus(seg, s.markedHp)
    return !isDestroyed && (isBroken || s.tokenCount > 0)
  })
  const isDestroyed = anyDestroyed
  const isBroken = anyBroken

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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Spacer balances the pencil's width so the name stays centered (#30) */}
              <div style={{ width: '1.5rem', flexShrink: 0 }} />
              <h4 style={{
                margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0,
                textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.name}</span>
                {isDestroyed && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase' }}>Destroyed</span>}
                {!isDestroyed && isBroken && <span style={{ fontSize: '0.75rem', color: 'var(--warning, #f59e0b)', fontWeight: 600, textTransform: 'uppercase' }}>Broken</span>}
              </h4>
              {/* Edit toggle — sits inline right after the name it edits, instead of
                  floating absolutely in the corner disconnected from the title (#30). */}
              <TouchTarget
                onClick={(e) => { e.stopPropagation(); setQuickEdit(true) }}
                title="Edit"
                wrapperStyle={{ flexShrink: 0 }}
                style={{ width: '1.5rem', height: '1.5rem', background: 'transparent', borderRadius: '0.25rem', color: 'var(--text-secondary)', transition: 'all 0.15s ease' }}
              >
                <Pencil size={12} />
              </TouchTarget>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="invisible-scrollbar">
          {/* Parent colossus pill intentionally removed (#112) — Jackson confirmed
              it's redundant with the card's own header and the "COLOSSUS: <name>"
              group header shown above the whole set of segment cards. */}

          {/* Row 1: Attack Modifier | Standard Attack (#109). Only rendered when
              the segment actually has an attack — otherwise this div would
              still contribute its own paddingTop even while empty, doubling
              up with Row 2's paddingTop below it (#109 round 3). */}
          {(seg.atk != null || seg.weapon) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, paddingTop: CARD_SPACE_V, paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H, flexWrap: 'wrap' }}>
              {seg.atk != null && (
                <MergedStatBadge shape="diamond" label="ATK" value={seg.atk >= 0 ? `+${seg.atk}` : seg.atk} />
              )}
              {seg.weapon && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
                  gap: '0.35rem', fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.3,
                  backgroundColor: 'black', border: '1px solid var(--text-secondary)', borderRadius: '0.25rem',
                  minHeight: '1.375rem', padding: '0.2rem 0.4rem', flex: '1 1 160px', minWidth: 0,
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
          )}

          {/* Row 2: Difficulty | Thresholds (#109) — matches the regular
              adversary card's DIFF+ThresholdPill row exactly (StatusSection.jsx) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: CARD_SPACE_H, paddingTop: CARD_SPACE_V, paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H }}>
            {seg.difficulty != null && (
              <MergedStatBadge shape="hex" label="DIFF" value={seg.difficulty} />
            )}
            {colossus.thresholds && <ColossusThresholdsBadge colossus={colossus} />}
          </div>

          {/* Row 3: Motives | Experience (framework-shared, #109) */}
          <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H, paddingTop: CARD_SPACE_V }}>
            <ColossusFrameworkInfo colossus={colossus} />
          </div>

          {/* Instance-style numbered mini-cards — one per segment.count,
              each with its own HP adjuster (segment-specific) and Stress
              adjuster (framework-shared), styled exactly like a regular
              adversary card's instance rows, plus an independent token
              counter (#109, #110) */}
          <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H, paddingTop: CARD_SPACE_V, display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
            {(slots || []).map((slot) => (
              <SegmentInstanceSlot
                key={slot.instanceKey}
                seg={seg}
                instanceKey={slot.instanceKey}
                instanceNumber={slot.instanceNumber}
                markedHp={slot.markedHp}
                onToggleHpPip={slot.onToggleHpPip}
                tokenCount={slot.tokenCount}
                onTokenChange={slot.onTokenChange}
                colossus={colossus}
                inst={inst}
                onUpdate={onUpdate}
              />
            ))}
          </div>

          {/* Features — segment-specific plus framework-wide, clearly distinguished */}
          <div style={{ paddingLeft: CARD_SPACE_H, paddingRight: CARD_SPACE_H }}>
            <SegmentFeatures segmentFeatures={seg.features} frameworkFeatures={colossus.features} />
          </div>

          <div style={{ height: CARD_SPACE_V }} />
        </div>
      </div>
    </ContainerWithTab>
  )
}

export default ColossusSegmentCard
