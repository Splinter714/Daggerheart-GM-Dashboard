import React, { useState, useCallback } from 'react'
import Panel from './Panels'
import GameCard from '../Adversaries/GameCard'
import { DASHBOARD_GAP } from './constants'
import { getCardScrollTarget } from './hooks/cardScrollTarget'
import { isColossusGroup, buildAdversaryItem } from './hooks/useEntityGroups'

// Collect consecutive same-groupName entries into sections (any entity type).
function buildSections(entityGroups) {
  const sections = []
  let i = 0
  while (i < entityGroups.length) {
    const g = entityGroups[i]
    if (g.groupName) {
      const entries = [g]
      let j = i + 1
      while (j < entityGroups.length && entityGroups[j].groupName === g.groupName) {
        entries.push(entityGroups[j])
        j++
      }
      sections.push({ type: 'grouped', groupName: g.groupName, entries, startFlatIndex: i })
      i = j
    } else {
      sections.push({ type: 'solo', entry: g, flatIndex: i })
      i++
    }
  }
  return sections
}

const EntityColumns = ({
  entityGroups,
  columnWidth,
  effectiveGap = DASHBOARD_GAP,
  isNarrow = false,
  scrollContainerRef,
  onScroll,
  newCards,
  removingCardSpacer,
  spacerShrinking,
  browserOpenAtPosition,
  editingAdversaryId,
  handleSaveCustomAdversary,
  handleCancelEdit,
  updateAdversary,
  updateEnvironment,
  adversaries,
  handleEditAdversary,
  createAdversary,
  createAdversariesBulk,
  pcCount,
  smoothScrollTo,
  getEntityGroups,
  deleteAdversary,
  deleteEnvironment,
  setRemovingCardSpacer,
  setSpacerShrinking,
  onOpenBrowser, instanceLabelStyle = 'numeric', recentlyAddedCards = new Set(),
}) => {
  const isGrouped = entityGroups.some(g => g.groupName)

  // Measure the actual rendered pill height so the frame line sits exactly at
  // the pill's vertical midpoint and the hook drop = exactly half the pill height.
  const GROUP_TAB_TOP_SPACE = DASHBOARD_GAP // px above pill top
  const [pillHeight, setPillHeight] = useState(22) // updated on first render
  const pillMeasureRef = useCallback(node => {
    if (node) {
      const h = node.getBoundingClientRect().height
      if (h > 0) setPillHeight(h)
    }
  }, [])
  const groupTabBarHeight = Math.round(GROUP_TAB_TOP_SPACE + pillHeight)
  const groupLineY = Math.round(GROUP_TAB_TOP_SPACE + pillHeight * 0.35)

  // When groupBy is active, compute each section's total width so we can
  // size group-level removal spacers correctly.
  const sectionWidthFor = (entryCount) =>
    entryCount * columnWidth + Math.max(0, entryCount - 1) * DASHBOARD_GAP

  // ─── Card panel renderer ────────────────────────────────────────────────────
  const renderCardPanel = (group, flatIndex, cssClass, isFirstInGroup = false, isLastInGroup = false) => {
    const isSpacerPosition =
      removingCardSpacer &&
      removingCardSpacer.baseName === group.baseName &&
      group.type === 'adversary' &&
      (!isGrouped || removingCardSpacer.isWithinGroup)

    if (isSpacerPosition) {
      const spacerPad = spacerShrinking ? '0px' : `${DASHBOARD_GAP}px`
      return (
        <Panel
          key={`spacer-${removingCardSpacer.baseName}`}
          style={{
            width: spacerShrinking ? '0px' : `${columnWidth}px`,
            flexShrink: 0, flexGrow: 0, flex: 'none',
            paddingRight: '0',
            paddingTop: spacerPad,
            paddingBottom: spacerPad,
            scrollSnapAlign: 'none', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            height: '100%', opacity: 0,
            transition: 'width 0.3s ease, padding-top 0.3s ease, padding-bottom 0.3s ease',
          }}
        />
      )
    }

    const isEditing = group.type === 'adversary' && editingAdversaryId &&
      group.instances.some(i => i.id === editingAdversaryId)

    return (
      <Panel
        key={group.type === 'adversary'
          ? `adversary-${!group.isColossusSegment && group.template?.id || group.baseName}` /* #109: segments share one template.id */
          : `${group.type}-${group.baseName}`}
        className={cssClass}
        dataCardKey={`${group.type}-${group.baseName}`}
        style={{
          width: `${columnWidth}px`,
          flexShrink: 0, flexGrow: 0, flex: 'none',
          paddingRight: '0',
          paddingTop: `${DASHBOARD_GAP}px`,
          paddingBottom: `${DASHBOARD_GAP}px`,
          scrollSnapAlign: 'start',
          overflow: isGrouped ? 'auto' : group.type === 'adversary' ? 'visible' : 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
          height: isGrouped ? '100%' : 'auto',
          scrollMarginLeft: undefined,
          scrollMarginRight: undefined,
          opacity: newCards.has(`${group.type}-${group.baseName}`) ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        <GameCard
          type={group.type}
          item={
            group.type === 'adversary'
              ? buildAdversaryItem(group)
              : { ...group.instances[0], name: group.instances[0]?.name || group.baseName }
          }
          segment={group.segment} segmentInstances={group.segmentInstances} mode="expanded" instanceLabelStyle={instanceLabelStyle}
          isRecentlyAdded={group.type === 'adversary' && recentlyAddedCards.has(`adversary-${group.baseName}`)}
          instances={
            group.type === 'adversary'
              ? [...group.instances]
                  .sort((a, b) => (a.duplicateNumber || 1) - (b.duplicateNumber || 1))
                  .map(inst => ({ ...inst, hpMax: group.template.hpMax, stressMax: group.template.stressMax }))
              : group.instances
          }
          showCustomCreator={isEditing}
          onSaveCustomAdversary={isEditing ? handleSaveCustomAdversary : undefined}
          onCancelEdit={isEditing ? handleCancelEdit : undefined}
          isStockAdversary={isEditing
            ? (!group.template?.source || group.template?.source !== 'Homebrew')
            : false}
          onApplyDamage={group.type === 'adversary'
            ? (id, damage) => {
                const inst = group.instances.find(i => i.id === id)
                if (inst) updateAdversary(id, { hp: Math.min(group.template.hpMax || 1, (inst.hp || 0) + damage) })
              }
            : undefined}
          onApplyHealing={group.type === 'adversary'
            ? (id, healing) => {
                const inst = group.instances.find(i => i.id === id)
                if (inst) updateAdversary(id, { hp: Math.max(0, (inst.hp || 0) - healing) })
              }
            : undefined}
          onApplyStressChange={group.type === 'adversary'
            ? (id, stress) => {
                const inst = group.instances.find(i => i.id === id)
                if (inst) updateAdversary(id, {
                  stress: Math.max(0, Math.min(group.template.stressMax || 6, (inst.stress || 0) + stress)),
                })
              }
            : undefined}
          onUpdate={
            group.type === 'adversary' ? updateAdversary
              : updateEnvironment}
          onDelete={
            group.type === 'environment' && deleteEnvironment
              ? () => deleteEnvironment(group.instances[0].id)
              : group.type === 'adversary' && group.template?.isColossus && deleteAdversary
                ? () => deleteAdversary(group.instances[0].id)
                : group.type === 'adversary' && deleteAdversary
                  ? () => {
                      const instances = group.instances
                      if (!instances.length) return
                      const groupIndex = entityGroups.findIndex(
                        g => g.baseName === group.baseName && g.type === 'adversary')
                      const isLeftmostColumn = groupIndex === 0
                      let wasAtMaxScroll = false
                      if (scrollContainerRef.current) {
                        const c = scrollContainerRef.current
                        wasAtMaxScroll = Math.abs(c.scrollLeft - (c.scrollWidth - c.clientWidth)) < 1
                      }
                      setRemovingCardSpacer({ baseName: group.baseName, groupIndex })
                      setSpacerShrinking(false)
                      if (isLeftmostColumn && scrollContainerRef.current) {
                        scrollContainerRef.current.style.scrollSnapType = 'none'
                      }
                      requestAnimationFrame(() => requestAnimationFrame(() => {
                        if (scrollContainerRef.current) scrollContainerRef.current.offsetHeight
                        instances.forEach(inst => deleteAdversary(inst.id))
                        requestAnimationFrame(() => requestAnimationFrame(() => {
                          if (scrollContainerRef.current) scrollContainerRef.current.offsetHeight
                          setTimeout(() => {
                            setSpacerShrinking(true)
                            if (wasAtMaxScroll && scrollContainerRef.current) {
                              const startTime = performance.now()
                              const tick = () => {
                                if (!scrollContainerRef.current) return
                                scrollContainerRef.current.scrollLeft =
                                  scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth
                                if (performance.now() - startTime < 300) requestAnimationFrame(tick)
                              }
                              requestAnimationFrame(tick)
                            }
                            setTimeout(() => {
                              setRemovingCardSpacer(null)
                              setSpacerShrinking(false)
                              if (isLeftmostColumn && scrollContainerRef.current) {
                                scrollContainerRef.current.style.scrollSnapType = 'x mandatory'
                              }
                            }, 300)
                          }, 50)
                        }))
                      }))
                    }
                  : undefined
          }
          adversaries={adversaries}
          showAddRemoveButtons={browserOpenAtPosition !== null && group.type === 'adversary' && !isColossusGroup(group)}
          onEdit={group.type === 'adversary' ? itemId => handleEditAdversary(itemId) : undefined}
          onAddInstance={group.type === 'adversary' && !isColossusGroup(group)
            ? item => {
                const isMinion = item.type === 'Minion'
                const instancesToAdd = isMinion ? pcCount : 1
                if (isMinion && instancesToAdd > 1) {
                  createAdversariesBulk(Array(instancesToAdd).fill(null).map(() => ({ ...item })))
                } else {
                  createAdversary(item)
                }
                setTimeout(() => {
                  requestAnimationFrame(() => requestAnimationFrame(() => {
                    if (!scrollContainerRef.current) return
                    const container = scrollContainerRef.current
                    const cardKey = `adversary-${group.baseName}`
                    const targetScroll = getCardScrollTarget({
                      container,
                      cardKey,
                      columnWidth,
                      browserOpenAtPosition,
                    })
                    if (targetScroll !== null) {
                      smoothScrollTo(targetScroll, 500)
                    }
                  }))
                }, 50)
              }
            : undefined}
          onRemoveInstance={group.type === 'adversary' && !isColossusGroup(group)
            ? () => {
                const isMinion = group.template?.type === 'Minion'
                const instancesToRemove = isMinion ? pcCount : 1
                const instances = [...group.instances]
                  .sort((a, b) => (b.duplicateNumber || 1) - (a.duplicateNumber || 1))
                if (instances.length === 0) return
                const isLastInstance = Math.max(0, instances.length - instancesToRemove) === 0
                const instancesToDelete = instances.slice(0, instancesToRemove)

                if (isLastInstance && !isGrouped) {
                  const groupIndex = entityGroups.findIndex(
                    g => g.baseName === group.baseName && g.type === 'adversary')
                  const isLeftmostColumn = groupIndex === 0
                  let wasAtMaxScroll = false
                  if (scrollContainerRef.current) {
                    const c = scrollContainerRef.current
                    wasAtMaxScroll = Math.abs(c.scrollLeft - (c.scrollWidth - c.clientWidth)) < 1
                  }
                  setRemovingCardSpacer({ baseName: group.baseName, groupIndex })
                  setSpacerShrinking(false)
                  if (isLeftmostColumn && scrollContainerRef.current) {
                    scrollContainerRef.current.style.scrollSnapType = 'none'
                  }
                  requestAnimationFrame(() => requestAnimationFrame(() => {
                    if (scrollContainerRef.current) scrollContainerRef.current.offsetHeight
                    instancesToDelete.forEach(inst => deleteAdversary(inst.id))
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                      if (scrollContainerRef.current) scrollContainerRef.current.offsetHeight
                      setTimeout(() => {
                        setSpacerShrinking(true)
                        if (wasAtMaxScroll && scrollContainerRef.current) {
                          const startTime = performance.now()
                          const duration = 300
                          const tick = () => {
                            if (!scrollContainerRef.current) return
                            scrollContainerRef.current.scrollLeft =
                              scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth
                            if (performance.now() - startTime < duration) requestAnimationFrame(tick)
                          }
                          requestAnimationFrame(tick)
                        }
                        setTimeout(() => {
                          setRemovingCardSpacer(null)
                          setSpacerShrinking(false)
                          if (isLeftmostColumn && scrollContainerRef.current) {
                            scrollContainerRef.current.style.scrollSnapType = 'x mandatory'
                          }
                          if (wasAtMaxScroll && scrollContainerRef.current) {
                            scrollContainerRef.current.scrollLeft =
                              scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth
                          }
                        }, 300)
                      }, 50)
                    }))
                  }))
                } else if (isLastInstance && isGrouped) {
                  // Find the section this group belongs to, to know if the whole
                  // section is going away or just one card within it.
                  const currentSections = buildSections(entityGroups)
                  const owningSection = currentSections.find(
                    s => s.type === 'grouped' &&
                         s.entries.some(e => e.baseName === group.baseName)
                  )
                  const isLastInSection = owningSection && owningSection.entries.length === 1

                  if (isLastInSection) {
                    // Whole group-wrapper disappears — animate a section-level spacer.
                    const gw = sectionWidthFor(owningSection.entries.length)
                    setRemovingCardSpacer({
                      baseName: group.baseName,
                      groupIndex: owningSection.startFlatIndex,
                      groupName: owningSection.groupName,
                      groupWidth: gw,
                      isGroupedSection: true,
                    })
                    setSpacerShrinking(false)
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                      instancesToDelete.forEach(inst => deleteAdversary(inst.id))
                      requestAnimationFrame(() => requestAnimationFrame(() => {
                        setTimeout(() => {
                          setSpacerShrinking(true)
                          setTimeout(() => {
                            setRemovingCardSpacer(null)
                            setSpacerShrinking(false)
                          }, 300)
                        }, 50)
                      }))
                    }))
                  } else {
                    // One card disappearing from within a multi-card section.
                    const groupIndex = entityGroups.findIndex(
                      g => g.baseName === group.baseName && g.type === 'adversary')
                    setRemovingCardSpacer({
                      baseName: group.baseName,
                      groupIndex,
                      isWithinGroup: true,
                    })
                    setSpacerShrinking(false)
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                      instancesToDelete.forEach(inst => deleteAdversary(inst.id))
                      requestAnimationFrame(() => requestAnimationFrame(() => {
                        setTimeout(() => {
                          setSpacerShrinking(true)
                          setTimeout(() => {
                            setRemovingCardSpacer(null)
                            setSpacerShrinking(false)
                          }, 300)
                        }, 50)
                      }))
                    }))
                  }
                } else {
                  instancesToDelete.forEach(inst => deleteAdversary(inst.id))
                }
              }
            : undefined}
        />
      </Panel>
    )
  }

  // ─── Build render items ─────────────────────────────────────────────────────

  const sections = buildSections(entityGroups)
  const items = []
  let firstGroupSeen = false

  sections.forEach((section, sectionIndex) => {
    const isFirstSection = sectionIndex === 0
    const isLastSection = sectionIndex === sections.length - 1
    const prevIsGrouped = sectionIndex > 0 && sections[sectionIndex - 1].type === 'grouped'
    const needsDoubleGap = section.type === 'grouped' && prevIsGrouped

    if (section.type === 'grouped') {
      const { groupName, entries, startFlatIndex } = section
      const sectionKey = `group-section-${groupName}-${startFlatIndex}`

      const cards = entries.map((group, i) => {
        const isFirst = isFirstSection && i === 0
        const isLast = isLastSection && i === entries.length - 1
        const cssClass = isFirst ? 'dashboard-column dashboard-column--first'
          : isLast ? 'dashboard-column dashboard-column--last'
          : 'dashboard-column'
        return renderCardPanel(group, startFlatIndex + i, cssClass, i === 0, i === entries.length - 1)
      })

      items.push(
        <div
          key={sectionKey}
          data-group-wrapper
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            flexGrow: 0,
            flex: 'none',
            height: '100%',
            // On narrow/mobile viewports the outer scroll container shows one
            // column at a time (scroll-snap). Without a width cap here, a
            // multi-entry group's cards row grows to its natural width
            // (entries * columnWidth), which breaks that single-column layout
            // and lets its cards render far wider than the viewport (#79).
            // Capping the wrapper to columnWidth and letting the cards row
            // scroll+snap internally keeps each card at the narrow width
            // while still allowing swiping between entries in the group.
            width: isNarrow ? `${columnWidth}px` : undefined,
          }}
        >
          {/* Inset top-tab label — full-width frame renders behind the pill.
              groupLineY and groupTabBarHeight are derived from the actual measured
              pill height, so the rail sits exactly at the pill's midpoint and the
              hook drop equals exactly half the pill height. */}
          {(() => {
            const isFirst = !firstGroupSeen
            if (isFirst) firstGroupSeen = true
            return (
              <div style={{
                height: groupTabBarHeight, position: 'relative',
              }}>
                {/* Sticky (not absolute) with an explicit width so its left edge
                    tracks the pinned pill instead of the wrapper's scrolled-away
                    edge — absolute + left:0/right:0 let the top border draw past
                    the pill once scrolled (#86). Needs a non-flex parent for the
                    100% width to resolve against the wrapper. */}
                <div data-testid="group-rail-border" style={{
                  position: 'sticky', top: groupLineY, left: 0, width: '100%',
                  height: `calc(100% - ${groupLineY}px - 6px)`,
                  borderTop: '1px solid var(--text-secondary)',
                  borderLeft: '1px solid var(--text-secondary)',
                  borderRight: '1px solid var(--text-secondary)',
                  borderTopRightRadius: 4, pointerEvents: 'none', boxSizing: 'border-box', zIndex: 1,
                }} />
                <span
                  ref={isFirst ? pillMeasureRef : undefined}
                  style={{
                    position: 'sticky',
                    left: 0,
                    display: 'inline-block',
                    zIndex: 1,
                    marginTop: GROUP_TAB_TOP_SPACE,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'white',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border)',
                    borderRadius: '6px',
                    padding: '3px 9px',
                  }}
                >
                  {groupName}
                </span>
              </div>
            )
          })()}
          {/* Cards row — on narrow viewports this scrolls+snaps internally so
              a multi-entry group (e.g. colossus segments) still shows one
              full-width card at a time instead of overflowing (#79). */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: `${DASHBOARD_GAP}px`,
            flex: 1,
            minHeight: 0,
            overflowX: isNarrow ? 'auto' : 'visible',
            scrollSnapType: isNarrow ? 'x mandatory' : undefined,
          }}>
            {cards}
          </div>
        </div>
      )
    } else {
      const { entry: group, flatIndex } = section
      const cssClass = isFirstSection ? 'dashboard-column dashboard-column--first'
        : isLastSection ? 'dashboard-column dashboard-column--last'
        : 'dashboard-column'
      items.push(renderCardPanel(group, flatIndex, cssClass))
    }
  })

  // Spacer for animated card removal — ungrouped mode OR grouped-section removal.
  if (removingCardSpacer && !items.some(item => item?.key === `spacer-${removingCardSpacer.baseName}`)) {
    if (!isGrouped) {
      // Ungrouped: plain column-width spacer
      const insertIndex = Math.min(removingCardSpacer.groupIndex, items.length)
      items.splice(insertIndex, 0,
        <Panel
          key={`spacer-${removingCardSpacer.baseName}`}
          className="dashboard-column"
          style={{
            width: spacerShrinking ? '0px' : `${columnWidth}px`,
            flexShrink: 0, flexGrow: 0, flex: 'none',
            paddingRight: '0',
            paddingTop: spacerShrinking ? '0px' : `${DASHBOARD_GAP}px`,
            paddingBottom: spacerShrinking ? '0px' : `${DASHBOARD_GAP}px`,
            scrollSnapAlign: 'none', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            height: '100%', opacity: 0,
            transition: 'width 0.3s ease, padding-top 0.3s ease, padding-bottom 0.3s ease',
          }}
        />
      )
    } else if (removingCardSpacer.isGroupedSection) {
      // Grouped: a whole group-wrapper just vanished — hold its spot then shrink.
      const insertIndex = Math.min(removingCardSpacer.groupIndex, items.length)
      items.splice(insertIndex, 0,
        <div
          key={`spacer-${removingCardSpacer.baseName}`}
          data-no-slide
          style={{
            width: spacerShrinking ? '0px' : `${removingCardSpacer.groupWidth}px`,
            flexShrink: 0, flexGrow: 0, flex: 'none',
            height: '100%',
            overflow: 'hidden',
            opacity: 0,
            transition: 'width 0.3s ease',
          }}
        />
      )
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      className="dashboard-scroll-container"
      onScroll={onScroll}
      style={{
        gap: `${effectiveGap}px`,
        paddingLeft: `${DASHBOARD_GAP}px`,
        paddingRight: `${DASHBOARD_GAP}px`,
        scrollPaddingLeft: `${DASHBOARD_GAP}px`,
        scrollPaddingRight: `${DASHBOARD_GAP}px`,
      }}
    >
      {items.length > 0 ? items : null}
      {browserOpenAtPosition !== null && (
        <div data-no-slide style={{ width: `${columnWidth}px`, flexShrink: 0, flexGrow: 0, flex: 'none', height: '100%' }} />
      )}
    </div>
  )
}

export default EntityColumns
