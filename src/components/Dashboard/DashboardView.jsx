import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useGameState } from '../../state/state'
import { DASHBOARD_GAP, PANEL_BORDER, PANEL_BORDER_RADIUS, PANEL_BOX_SHADOW } from './constants'
import PWAInstallPrompt from './PWAInstallPrompt'
import { useAppKeyboardShortcuts } from './useAppKeyboardShortcuts'
import {
  calculateBaseBattlePoints,
  calculateSpentBattlePoints,
  calculateAutomaticAdjustments,
  calculateAvailableBattlePoints,
} from './BattlePointsCalculator'
import RightColumn from './RightColumn'
import EntityColumns from './EntityColumns'
import CustomAdversaryCreator from '../Adversaries/CustomAdversaryCreator'
import { useMinionSync } from './hooks/useMinionSync'
import { useColumnLayout } from './hooks/useColumnLayout'
import ErrorBoundary from './ErrorBoundary'
import { useBrowserOverlay } from './hooks/useBrowserOverlay'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useEntityGroups } from './hooks/useEntityGroups'
import { useAdversaryAddition } from './hooks/useAdversaryAddition'
import { useAdversaryToast } from './hooks/useAdversaryToast'
import { useDashboardSortGroup } from './hooks/useDashboardSortGroup'
import AdversaryToast from './AdversaryToast'
import NavRail, { RAIL_SIZE, isPWA } from './NavRail'
import './DashboardView.css'

// Main Dashboard View Component
const DashboardContent = () => {
  const {
    adversaries,
    adversaryGroups,
    environments,
    fear,
    partySize,
    customContent,
    updatePartySize,
    updateFear,
    createAdversary,
    createAdversariesBulk,
    updateAdversary,
    deleteAdversary,
    addCustomAdversary,
    updateCustomAdversary,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
  } = useGameState()

  const pcCount = partySize || 4

  // Dashboard state
  const [adversaryCreatorOpen, setAdversaryCreatorOpen] = useState(false)
  const [bpAdjustments, setBpAdjustments] = useState({ lessDifficult: false, increasedDamage: false, moreDangerous: false })
  const [editingAdversaryId, setEditingAdversaryId] = useState(null)
  const [browserActiveTab, setBrowserActiveTab] = useState('adversaries')
  const [browserContentType, setBrowserContentType] = useState('adversary') // 'adversary' | 'environment'
  const [selectedCustomAdversaryId, setSelectedCustomAdversaryId] = useState(null)
  const [rightColumnMode, setRightColumnMode] = useState('browser') // 'browser' | 'info' | 'receipt'
  const { sortBy, sortDir, groupBy, colossusDisplayMode, instanceLabelStyle, setSortBy, setGroupBy, setColossusDisplayMode, setInstanceLabelStyle } = useDashboardSortGroup()

  // Narrow screen detection for NavRail placement
  const dashboardRootRef = useRef(null)

  // Column layout state
  const [newCards, setNewCards] = useState(new Set())
  const [removingCardSpacer, setRemovingCardSpacer] = useState(null)
  const [spacerShrinking, setSpacerShrinking] = useState(false)
  const scrollContainerRef = useRef(null)
  useMinionSync(adversaryGroups, pcCount, createAdversariesBulk, deleteAdversary)

  const { entityGroups, getEntityGroups } = useEntityGroups(adversaryGroups, environments, sortBy, sortDir, groupBy, colossusDisplayMode)

  const effectiveGap = DASHBOARD_GAP
  const edgePadding = DASHBOARD_GAP

  const { columnWidth, visibleColumns } = useColumnLayout(scrollContainerRef, effectiveGap, edgePadding, RAIL_SIZE)
  const isNarrow = visibleColumns < 2
  const { toastMessage, showAdversaryToast } = useAdversaryToast()

  const { browserOpenAtPosition, handleOpenBrowser, handleCloseBrowser } = useBrowserOverlay({
    scrollContainerRef,
    columnWidth,
    onCloseReset: () => { setBrowserActiveTab('adversaries'); setBrowserContentType('adversary'); setRightColumnMode('browser') }
  })

  const smoothScrollTo = useSmoothScroll(scrollContainerRef)

  const openRightColumn = useCallback((mode) => {
    setRightColumnMode(mode)
    handleOpenBrowser(entityGroups.length)
  }, [handleOpenBrowser, entityGroups])

  // Keyboard shortcuts
  useAppKeyboardShortcuts({
    browserOpenAtPosition,
    handleCloseBrowser,
    handleOpenBrowser,
    getEntityGroups,
    fear,
    updateFear
  })

  const handleAddAdversaryFromBrowser = useAdversaryAddition({
    entityGroups,
    pcCount,
    scrollContainerRef,
    createAdversariesBulk,
    createAdversary,
    setNewCards,
    getEntityGroups,
    smoothScrollTo,
    browserOpenAtPosition,
    columnWidth,
    sortBy,
    sortDir,
    groupBy,
    onAdversaryAdded: isNarrow ? showAdversaryToast : undefined
  })

  // Handle editing an adversary
  const handleEditAdversary = useCallback((adversaryId) => {
    setEditingAdversaryId(adversaryId)
  }, [])

  // Handle canceling edit/create
  const handleCancelEdit = useCallback(() => {
    setEditingAdversaryId(null)
  }, [])

  // Handle saving custom adversary (create or update)
  const handleSaveCustomAdversary = useCallback(async (adversaryData, id) => {
    if (id) {
      // Find the adversary being edited to check if it's a custom adversary
      const editingAdversary = adversaries.find(a => a.id === id)
      const isCustomAdversary = editingAdversary?.source === 'Homebrew' || editingAdversary?.isCustom
      
      if (isCustomAdversary) {
        // Find the custom content entry by customContentId stored in dashboard instance, or by original baseName
        const customContentId = editingAdversary?.customContentId
        const originalBaseName = editingAdversary?.baseName // Original baseName before potential change
        const customAdversary = customContentId 
          ? customContent?.adversaries?.find(adv => adv.id === customContentId)
          : customContent?.adversaries?.find(adv => 
              adv.baseName === originalBaseName && (adv.source === 'Homebrew' || adv.isCustom)
            )
        
        if (customAdversary) {
          // Update custom adversary in custom content storage (for browser)
          // Ensure name is set for custom content (use baseName, no duplicate numbers)
          const customContentData = {
            ...adversaryData,
            name: adversaryData.baseName || adversaryData.name
          }
          updateCustomAdversary(customAdversary.id, customContentData)
          
          // Update all instances on dashboard with the same baseName (or customContentId)
          const baseName = adversaryData.baseName || editingAdversary?.baseName
          adversaries.forEach(adv => {
            if (adv.customContentId === customContentId || 
                (adv.baseName === baseName && (adv.source === 'Homebrew' || adv.isCustom))) {
              updateAdversary(adv.id, { 
                ...adversaryData, 
                customContentId: customAdversary.id // Ensure customContentId is set
              })
            }
          })
        } else {
          // Not found in custom content - might be a new custom adversary, add it
          // Ensure name is set for custom content
          const customContentData = {
            ...adversaryData,
            name: adversaryData.baseName || adversaryData.name
          }
          const newCustomId = addCustomAdversary(customContentData)
          
          // Update all instances on dashboard with the same baseName to include customContentId
          const baseName = adversaryData.baseName || editingAdversary?.baseName
          adversaries.forEach(adv => {
            if (adv.baseName === baseName && (adv.source === 'Homebrew' || adv.isCustom)) {
              updateAdversary(adv.id, { 
                ...adversaryData, 
                customContentId: newCustomId 
              })
            }
          })
        }
      } else {
        // Stock adversary - create new custom copy (Save As)
        // Find all instances of this stock adversary to replace them
        const originalBaseName = editingAdversary?.baseName
        const stockInstances = adversaries.filter(adv => {
          // Match by baseName
          const matchesBaseName = adv.baseName === originalBaseName
          // Stock adversaries don't have source='Homebrew' or isCustom=true
          const isStock = !adv.source || (adv.source !== 'Homebrew' && !adv.isCustom)
          return matchesBaseName && isStock
        })
        
        // Ensure name is set for custom content
        const customContentData = {
          ...adversaryData,
          name: adversaryData.baseName || adversaryData.name
        }
        const customId = addCustomAdversary(customContentData)
        
        // Delete all stock instances
        stockInstances.forEach(stockInstance => {
          deleteAdversary(stockInstance.id)
        })
        
        // Create new custom instances to replace them (same quantity)
        // Use setTimeout to ensure deletes complete before creating new ones
        setTimeout(() => {
          const instancesToCreate = stockInstances.map(() => ({
            ...adversaryData,
            source: 'Homebrew',
            isCustom: true,
            customContentId: customId,
            hp: 0,
            stress: 0
          }))
          
          if (instancesToCreate.length > 0) {
            createAdversariesBulk(instancesToCreate)
          }
        }, 0)
      }
      setEditingAdversaryId(null)
      // Browser will auto-refresh via useEffect watching customContent
    } else if (editingAdversaryId) {
      // Editing a stock adversary without id passed - create new custom copy
      // Ensure name is set for custom content
      const customContentData = {
        ...adversaryData,
        name: adversaryData.baseName || adversaryData.name
      }
      const customId = addCustomAdversary(customContentData)
      const newId = createAdversary({ 
        ...adversaryData, 
        source: 'Homebrew', 
        isCustom: true,
        customContentId: customId 
      })
      setEditingAdversaryId(null)
      // Browser will auto-refresh via useEffect watching customContent
      return newId
    } else {
      // Creating new custom adversary from blank
      // First save to custom content storage
      // Ensure name is set for custom content
      const customContentData = {
        ...adversaryData,
        name: adversaryData.baseName || adversaryData.name
      }
      const customId = addCustomAdversary(customContentData)
      // Then create instance on dashboard (createAdversary will generate its own ID)
      const newId = createAdversary({ 
        ...adversaryData, 
        source: 'Homebrew', 
        isCustom: true,
        customContentId: customId 
      })
      // Browser will auto-refresh via useEffect watching customContent
      return newId
    }
  }, [
    editingAdversaryId,
    adversaries,
    customContent,
    createAdversary,
    updateAdversary,
    addCustomAdversary,
    updateCustomAdversary,
    createAdversariesBulk,
    deleteAdversary
  ])

  // Convert adversaries to encounter items format for battle points calculation
  const getEncounterItems = useCallback(() => {
    const grouped = {}
    adversaries.forEach(adversary => {
      const baseName = adversary.baseName || adversary.name?.replace(/\s+\(\d+\)$/, '') || adversary.name
      if (!grouped[baseName]) {
        grouped[baseName] = {
          type: 'adversary',
          item: adversary,
          quantity: 0
        }
      }
      grouped[baseName].quantity += 1
    })
    return Object.values(grouped)
  }, [adversaries])

  // Calculate battle points for balance display
  const encounterItems = getEncounterItems()
  const automaticAdjustments = calculateAutomaticAdjustments(encounterItems)
  const availableBattlePoints = calculateAvailableBattlePoints(pcCount, bpAdjustments) + automaticAdjustments
  const spentBattlePoints = calculateSpentBattlePoints(encounterItems, pcCount)

  // Scroll handling - persist position so it survives PWA kills, app-switches, and reloads
  const scrollTimeoutRef = useRef(null)
  const SCROLL_KEY = 'dashboard-scroll-left'
  const scrollRestoredRef = useRef(false)
  const isRestoringRef = useRef(false)
  // Capture the saved position at first render, before any scroll event can overwrite it.
  const savedScrollRef = useRef(
    typeof localStorage !== 'undefined' ? parseFloat(localStorage.getItem(SCROLL_KEY)) : NaN
  )

  // Stop the browser's own scroll restoration from fighting ours.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  const restoreScroll = useCallback(() => {
    const target = savedScrollRef.current
    if (!target || Number.isNaN(target)) return

    isRestoringRef.current = true
    // Enforce the target every frame for a window of time, so late layout passes or
    // a browser scroll-reset can't leave us at 0. This runs under the launch overlay.
    const deadline = Date.now() + 1200

    const tick = () => {
      const container = scrollContainerRef.current
      if (!container) { isRestoringRef.current = false; return }
      container.style.scrollSnapType = 'none'
      const maxScroll = container.scrollWidth - container.clientWidth
      const clamped = Math.min(target, Math.max(0, maxScroll))
      if (Math.abs(container.scrollLeft - clamped) > 1) {
        container.scrollLeft = clamped
      }
      if (Date.now() < deadline) {
        requestAnimationFrame(tick)
      } else {
        container.style.scrollSnapType = ''
        isRestoringRef.current = false
      }
    }
    requestAnimationFrame(tick)
  }, [scrollContainerRef])

  const handleScroll = useCallback((e) => {
    // Don't clobber the saved value while we're programmatically restoring.
    if (isRestoringRef.current) return
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    const container = e.target
    savedScrollRef.current = container.scrollLeft
    localStorage.setItem(SCROLL_KEY, container.scrollLeft)
    scrollTimeoutRef.current = setTimeout(() => {
      if (container && container.style.scrollSnapType === 'none') {
        container.style.scrollSnapType = 'x mandatory'
      }
    }, 150)
  }, [])

  // Restore on initial mount (handles full reload / PWA kill). Re-attempt as columnWidth
  // resolves so the container is present and laid out when we enforce the position.
  useEffect(() => {
    if (!scrollRestoredRef.current && scrollContainerRef.current) {
      scrollRestoredRef.current = true
      restoreScroll()
    }
  }, [columnWidth, restoreScroll])

  // Restore on app resume: visibilitychange (warm switch) and pageshow (bfcache restore)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') restoreScroll() }
    const onPageShow = (e) => { if (e.persisted) restoreScroll() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [restoreScroll])

  const navPlacement = isNarrow ? 'bottom' : 'right'
  const railPadding = isNarrow
    ? { paddingBottom: isPWA ? `calc(${RAIL_SIZE}px + 2rem)` : `${RAIL_SIZE}px` }
    : { paddingRight: `${RAIL_SIZE}px` }

  const rightColumnOpen = browserOpenAtPosition !== null

  const navActiveId = adversaryCreatorOpen
    ? 'create'
    : rightColumnOpen
    ? rightColumnMode === 'receipt' ? 'receipt'
      : rightColumnMode === 'info' ? 'info'
      : browserContentType === 'environment' ? 'browse-env'
      : 'browse'
    : null

  const handleNavAction = useCallback((id) => {
    if (id === 'dashboard') {
      handleCloseBrowser()
      setAdversaryCreatorOpen(false)
      return
    }

    // Determine if this action is already the active view
    const alreadyActive =
      (id === 'browse'     && rightColumnOpen && rightColumnMode === 'browser' && browserContentType === 'adversary') ||
      (id === 'browse-env' && rightColumnOpen && rightColumnMode === 'browser' && browserContentType === 'environment') ||
      (id === 'create'     && adversaryCreatorOpen) ||
      (id === 'receipt'    && rightColumnOpen && rightColumnMode === 'receipt') ||
      (id === 'info'       && rightColumnOpen && rightColumnMode === 'info')

    // Mobile: tapping the current item does nothing (only the dashboard button goes back)
    if (isNarrow && alreadyActive) return

    // Desktop: tapping the current item closes it (toggle)
    if (!isNarrow && alreadyActive) {
      if (id === 'create') setAdversaryCreatorOpen(false)
      else handleCloseBrowser()
      return
    }

    // Activate
    if (id === 'browse' || id === 'browse-env') {
      const contentType = id === 'browse-env' ? 'environment' : 'adversary'
      setAdversaryCreatorOpen(false)
      setBrowserContentType(contentType)
      setRightColumnMode('browser')
      if (!rightColumnOpen) handleOpenBrowser(entityGroups.length)
    } else if (id === 'create') {
      handleCloseBrowser()
      setAdversaryCreatorOpen(true)
    } else if (id === 'receipt') {
      setAdversaryCreatorOpen(false)
      openRightColumn('receipt')
    } else if (id === 'info') {
      setAdversaryCreatorOpen(false)
      openRightColumn('info')
    }
  }, [isNarrow, adversaryCreatorOpen, rightColumnOpen, rightColumnMode, browserContentType, handleCloseBrowser, handleOpenBrowser, openRightColumn, entityGroups])

  // On mobile the creator uses the right-column slot; on desktop it's a centered modal.
  // NavRail stays visible in both cases on desktop; on mobile it shows above the creator column.
  const showNavRail = true

  return (
    <div
      ref={dashboardRootRef}
      className="app dashboard-root"
      style={{ '--dashboard-gap': `${DASHBOARD_GAP}px`, ...railPadding }}
    >
      {/* Main Dashboard Content */}
      <div className="dashboard-main">
        {rightColumnOpen && (isNarrow ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 99, backgroundColor: 'var(--bg-primary)' }} />
        ) : (
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: `${columnWidth + DASHBOARD_GAP}px`, zIndex: 99, backgroundColor: 'var(--bg-primary)' }} />
        ))}
        {adversaryCreatorOpen && !isNarrow && (
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: `${2 * columnWidth + 2 * DASHBOARD_GAP}px`, zIndex: 99, backgroundColor: 'var(--bg-primary)' }} />
        )}
        <RightColumn
            open={rightColumnOpen}
            mode={rightColumnMode}
            columnWidth={columnWidth}
            onClose={handleCloseBrowser}
            browserContentType={browserContentType}
            browserActiveTab={browserActiveTab}
            onTabChange={setBrowserActiveTab}
            selectedCustomAdversaryId={selectedCustomAdversaryId}
            onSelectCustomAdversary={setSelectedCustomAdversaryId}
            onAddAdversaryFromBrowser={handleAddAdversaryFromBrowser}
            onAddEnvironmentFromBrowser={createEnvironment}
            pcCount={pcCount}
            updatePartySize={updatePartySize}
            adversaryGroups={adversaryGroups}
            createAdversary={createAdversary}
            createAdversariesBulk={createAdversariesBulk}
            deleteAdversary={deleteAdversary}
            bpAdjustments={bpAdjustments}
            onChangeBpAdjustments={setBpAdjustments}
            availableBattlePoints={availableBattlePoints}
            spentBattlePoints={spentBattlePoints}
            sortBy={sortBy}
            sortDir={sortDir}
            groupBy={groupBy}
            onSortBy={setSortBy}
            onGroupBy={setGroupBy} colossusDisplayMode={colossusDisplayMode} onColossusDisplayModeChange={setColossusDisplayMode}
            instanceLabelStyle={instanceLabelStyle} onInstanceLabelStyleChange={setInstanceLabelStyle}
          />
        <EntityColumns
          entityGroups={entityGroups}
          columnWidth={columnWidth}
          effectiveGap={effectiveGap}
          isNarrow={isNarrow}
          scrollContainerRef={scrollContainerRef}
          onScroll={handleScroll}
          newCards={newCards}
          removingCardSpacer={removingCardSpacer}
          spacerShrinking={spacerShrinking}
          browserOpenAtPosition={browserOpenAtPosition}
          editingAdversaryId={editingAdversaryId}
          handleSaveCustomAdversary={handleSaveCustomAdversary}
          handleCancelEdit={handleCancelEdit}
          updateAdversary={updateAdversary}
          updateEnvironment={updateEnvironment}
          adversaries={adversaries}
          handleEditAdversary={handleEditAdversary}
          createAdversary={createAdversary}
          createAdversariesBulk={createAdversariesBulk}
          pcCount={pcCount}
          smoothScrollTo={smoothScrollTo}
          getEntityGroups={getEntityGroups}
          deleteAdversary={deleteAdversary}
          deleteEnvironment={deleteEnvironment}
          setRemovingCardSpacer={setRemovingCardSpacer}
          setSpacerShrinking={setSpacerShrinking} instanceLabelStyle={instanceLabelStyle}
          onOpenBrowser={() => {
            if (!rightColumnOpen) openRightColumn('browser')
          }}
        />

        {/* Custom Adversary Creator — inside dashboard-main so position:absolute matches RightColumn */}
        {adversaryCreatorOpen && (
          isNarrow ? (
            <>
              <div style={{ position: 'absolute', inset: 0, zIndex: 99, backgroundColor: 'var(--bg-primary)' }} />
              <div style={{
                position: 'absolute',
                top: `${DASHBOARD_GAP}px`, right: `${DASHBOARD_GAP}px`,
                bottom: `${DASHBOARD_GAP}px`, left: `${DASHBOARD_GAP}px`,
                zIndex: 100,
                backgroundColor: 'var(--bg-primary)',
                border: PANEL_BORDER,
                borderRadius: PANEL_BORDER_RADIUS,
                boxShadow: PANEL_BOX_SHADOW,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                <CustomAdversaryCreator
                  onSave={(adversaryData, id) => {
                    if (id) { updateCustomAdversary(id, adversaryData) } else { addCustomAdversary(adversaryData) }
                    setAdversaryCreatorOpen(false)
                  }}
                  onSaveAndAdd={(adversaryData) => {
                    addCustomAdversary(adversaryData)
                    createAdversary({ ...adversaryData })
                    setAdversaryCreatorOpen(false)
                  }}
                  onAddToEncounter={(adversaryData) => {
                    createAdversary({ ...adversaryData })
                    setAdversaryCreatorOpen(false)
                  }}
                  onCancelEdit={() => setAdversaryCreatorOpen(false)}
                  customAdversaries={customContent?.adversaries || []}
                  embedded={false}
                  autoFocus
                />
              </div>
            </>
          ) : (
            // Desktop: CustomAdversaryCreator renders two absolute column panels itself
            <CustomAdversaryCreator
              onSave={(adversaryData, id) => {
                if (id) { updateCustomAdversary(id, adversaryData) } else { addCustomAdversary(adversaryData) }
                setAdversaryCreatorOpen(false)
              }}
              onAddToEncounter={(adversaryData) => {
                createAdversary({ ...adversaryData })
                setAdversaryCreatorOpen(false)
              }}
              onCancelEdit={() => setAdversaryCreatorOpen(false)}
              customAdversaries={customContent?.adversaries || []}
              embedded={false}
              autoFocus
              columnWidth={columnWidth}
            />
          )
        )}
      </div>


      <PWAInstallPrompt />

      {isNarrow && <AdversaryToast message={toastMessage} />}

      {showNavRail && (
        <NavRail
          placement={navPlacement}
          activeId={navActiveId}
          onAction={handleNavAction}
        />
      )}
    </div>
  )
}

// Dashboard wrapper with providers
const DashboardView = () => {
  const { isLoaded } = useGameState()

  if (!isLoaded) {
    return (
      <div className="app loading-state">
        <div className="loading-placeholder" aria-hidden="true" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  )
}

export default DashboardView
