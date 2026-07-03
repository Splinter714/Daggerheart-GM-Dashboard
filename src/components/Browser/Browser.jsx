import React, { useEffect, useRef, useState } from 'react'
import { useGameState } from '../../state/state'
import CustomAdversaryCreator from '../Adversaries/CustomAdversaryCreator'
import { calculateBaseBattlePoints, calculateSpentBattlePoints, calculateAutomaticAdjustments } from '../Dashboard/BattlePointsCalculator'
import { loadCustomContent, saveCustomContent } from './DataLibrary'
import { styles } from './Browser.styles'
import AdversaryList from './AdversaryList'
import { useBrowser, updateCustomContent, deleteCustomContent } from './useBrowser'
import BrowserHeader from './BrowserHeader'
import BrowserButtonRow from './BrowserButtonRow'
import BrowserTableHeader from './BrowserTableHeader'
import BrowserRow from './BrowserRow'

// Main Browser Component
const Browser = ({ type, onAddItem, onCancel = null, onRowClick, encounterItems = [], pcCount = 4, playerTier = 1, partyControls = null, showContainer = true, savedEncounters = [], onLoadEncounter, onDeleteEncounter, activeTab = 'adversaries', selectedCustomAdversaryId, onSelectCustomAdversary, onTabChange, selectedAdversary, onSelectAdversary, filterCustom = false, showCustomToggle = false, onToggleCustom, onExportCustomAdversaries, onImportCustomAdversaries, autoFocus = false, hideImportExport = false, onClose = null, searchPlaceholder = "Search" }) => {
  const { addCustomAdversary, updateCustomAdversary, deleteCustomAdversary, customContent, adversaries, deleteAdversary } = useGameState()
  const [editingAdversary, setEditingAdversary] = useState(null)
  const [deleteConfirmations, setDeleteConfirmations] = useState({}) // Track which encounters are in delete confirmation state
  const [deleteAdversaryConfirmations, setDeleteAdversaryConfirmations] = useState({}) // Track which custom adversaries are in delete confirmation state
  const deleteTimeouts = useRef({}) // Track timeouts for each encounter
  const deleteAdversaryTimeouts = useRef({}) // Track timeouts for each custom adversary
  
  // Keyboard navigation state - track by item ID for stability
  const [focusedItemId, setFocusedItemId] = useState(null)
  const rowRefs = useRef({}) // Refs for each row (keyed by item id) to scroll into view
  
  // Export custom adversaries to CSV file
  const handleExportCustomAdversaries = () => {
    try {
      const adversaries = customContent.adversaries || []
      
      if (adversaries.length === 0) {
        alert('No custom adversaries to export.')
        return
      }
      
      // Define CSV headers
      const headers = [
        'name', 'tier', 'type', 'difficulty', 'threshold_major', 'threshold_severe',
        'hp_max', 'stress_max', 'atk', 'weapon', 'range', 'damage',
        'description', 'motives'
      ]
      
      // Convert adversaries to CSV rows
      const rows = adversaries.map(adv => [
        adv.name || '',
        adv.tier || '',
        adv.type || '',
        adv.difficulty || '',
        adv.thresholds?.major || '',
        adv.thresholds?.severe || '',
        adv.hpMax || '',
        adv.stressMax || '',
        adv.atk || '',
        adv.weapon || '',
        adv.range || '',
        adv.damage || '',
        adv.description || '',
        adv.motives || ''
      ])
      
      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value) => {
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      
      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n')
      
      // Create and download file
      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `daggerheart-custom-adversaries-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`Exported ${adversaries.length} custom adversaries to CSV`)
    } catch (error) {
      console.error('Failed to export custom adversaries:', error)
      alert('Failed to export custom adversaries. Please try again.')
    }
  }
  
  // Import custom adversaries from CSV file
  const handleImportCustomAdversaries = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Check file type
    const isCSV = file.name.endsWith('.csv')
    const isJSON = file.name.endsWith('.json')
    
    if (!isCSV && !isJSON) {
      alert('Please upload a CSV or JSON file.')
      event.target.value = ''
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let importedAdversaries = []
        
        if (isCSV) {
          // Parse CSV
          const csvText = e.target.result
          const lines = csvText.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            throw new Error('CSV file is empty or invalid.')
          }
          
          // Parse header row
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
          
          // Parse data rows
          for (let i = 1; i < lines.length; i++) {
            const values = []
            let current = ''
            let inQuotes = false
            
            // Handle CSV parsing with quoted values
            for (let j = 0; j < lines[i].length; j++) {
              const char = lines[i][j]
              const nextChar = lines[i][j + 1]
              
              if (char === '"' && inQuotes && nextChar === '"') {
                current += '"'
                j++ // Skip next quote
              } else if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            values.push(current.trim())
            
            // Map values to adversary object
            const adversary = {
              name: values[headers.indexOf('name')] || '',
              tier: parseInt(values[headers.indexOf('tier')]) || 1,
              type: values[headers.indexOf('type')] || 'Standard',
              difficulty: parseInt(values[headers.indexOf('difficulty')]) || 11,
              thresholds: {
                major: parseInt(values[headers.indexOf('threshold_major')]) || 7,
                severe: parseInt(values[headers.indexOf('threshold_severe')]) || 12
              },
              hpMax: parseInt(values[headers.indexOf('hp_max')]) || 3,
              stressMax: parseInt(values[headers.indexOf('stress_max')]) || 1,
              atk: parseInt(values[headers.indexOf('atk')]) || 1,
              weapon: values[headers.indexOf('weapon')] || '',
              range: values[headers.indexOf('range')] || 'Melee',
              damage: values[headers.indexOf('damage')] || '',
              description: values[headers.indexOf('description')] || '',
              motives: values[headers.indexOf('motives')] || '',
              source: 'Homebrew'
            }
            
            if (adversary.name) {
              importedAdversaries.push(adversary)
            }
          }
        } else if (isJSON) {
          // Parse JSON (legacy format support)
          const importData = JSON.parse(e.target.result)
          
          if (!importData.customAdversaries || !Array.isArray(importData.customAdversaries)) {
            throw new Error('Invalid JSON format. Expected customAdversaries array.')
          }
          
          importedAdversaries = importData.customAdversaries
        }
        
        // Check for duplicates against existing custom content
        const existingAdversaries = customContent.adversaries || []

        let addedCount = 0
        let skippedCount = 0

        importedAdversaries.forEach(importedAdv => {
          // Check if adversary with same name already exists
          const exists = existingAdversaries.some(existing =>
            existing.name === importedAdv.name && existing.source === importedAdv.source
          )

          if (!exists) {
            // Add via the React action — it assigns a fresh id and updates state
            // in place, so no page reload is needed.
            addCustomAdversary({ ...importedAdv, hp: 0, stress: 0 })
            addedCount++
          } else {
            skippedCount++
          }
        })

        if (addedCount > 0) {
          alert(`Import successful! Added ${addedCount} new adversaries${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}.`)
        } else {
          alert('No new adversaries were added. All imported adversaries already exist.')
        }
        
      } catch (error) {
        console.error('Failed to import custom adversaries:', error)
        alert(`Failed to import custom adversaries: ${error.message}`)
      }
    }
    
    reader.readAsText(file)
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }
  
  // Handle editing custom adversaries
  const handleEditAdversary = (adversary) => {
    setEditingAdversary(adversary)
    // Switch to create tab
    if (onTabChange) {
      onTabChange('create')
    }
  }

  const handleCancelEdit = () => {
    setEditingAdversary(null)
  }

  const handleSaveAdversary = async (adversaryData, id) => {
    if (id) {
      // Update existing adversary
      updateCustomAdversary(id, adversaryData)
    } else {
      // Create new adversary
      addCustomAdversary(adversaryData)
    }
  }
  
  // Handle two-stage delete
  const handleDeleteClick = (encounterId) => {
    if (deleteConfirmations[encounterId]) {
      // Second click - actually delete (no popup confirmation)
      onDeleteEncounter && onDeleteEncounter(encounterId)
      setDeleteConfirmations(prev => {
        const newState = { ...prev }
        delete newState[encounterId]
        return newState
      })
      // Clear any existing timeout
      if (deleteTimeouts.current[encounterId]) {
        clearTimeout(deleteTimeouts.current[encounterId])
        delete deleteTimeouts.current[encounterId]
      }
    } else {
      // First click - show confirmation state
      setDeleteConfirmations(prev => ({
        ...prev,
        [encounterId]: true
      }))
      
      // Clear any existing timeout for this encounter
      if (deleteTimeouts.current[encounterId]) {
        clearTimeout(deleteTimeouts.current[encounterId])
      }
      
      // Set timeout to revert after 3 seconds
      deleteTimeouts.current[encounterId] = setTimeout(() => {
        setDeleteConfirmations(prev => {
          const newState = { ...prev }
          delete newState[encounterId]
          return newState
        })
        delete deleteTimeouts.current[encounterId]
      }, 3000)
    }
  }
  
  // Handle two-stage delete for custom adversaries
  const handleDeleteCustomAdversary = (adversaryId) => {
    if (deleteAdversaryConfirmations[adversaryId]) {
      // Second click - actually delete
      // First, find and delete all dashboard instances that reference this custom adversary
      const dashboardInstances = adversaries.filter(adv => adv.customContentId === adversaryId)
      dashboardInstances.forEach(adv => {
        deleteAdversary(adv.id)
      })
      
      // Then delete from custom content
      deleteCustomAdversary(adversaryId)
      
      // Clear confirmation state
      setDeleteAdversaryConfirmations(prev => {
        const newState = { ...prev }
        delete newState[adversaryId]
        return newState
      })
      
      // Clear timeout
      if (deleteAdversaryTimeouts.current[adversaryId]) {
        clearTimeout(deleteAdversaryTimeouts.current[adversaryId])
        delete deleteAdversaryTimeouts.current[adversaryId]
      }
    } else {
      // First click - show confirmation state
      setDeleteAdversaryConfirmations(prev => ({
        ...prev,
        [adversaryId]: true
      }))
      
      // Clear any existing timeout
      if (deleteAdversaryTimeouts.current[adversaryId]) {
        clearTimeout(deleteAdversaryTimeouts.current[adversaryId])
      }
      
      // Set timeout to revert after 3 seconds
      deleteAdversaryTimeouts.current[adversaryId] = setTimeout(() => {
        setDeleteAdversaryConfirmations(prev => {
          const newState = { ...prev }
          delete newState[adversaryId]
          return newState
        })
        delete deleteAdversaryTimeouts.current[adversaryId]
      }, 3000)
    }
  }
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(deleteTimeouts.current).forEach(timeout => {
        clearTimeout(timeout)
      })
      Object.values(deleteAdversaryTimeouts.current).forEach(timeout => {
        clearTimeout(timeout)
      })
    }
  }, [])
  
  const {
    searchTerm,
    setSearchTerm,
    sortFields,
    handleSort,
    filteredAndSortedData,
    loading,
    // Advanced filtering
    selectedTiers,
    selectedTypes,
    showTierDropdown,
    setShowTierDropdown,
    showTypeDropdown,
    setShowTypeDropdown,
    tierFilterRef,
    typeFilterRef,
    uniqueTiers,
    uniqueTypes,
    handleTierSelect,
    handleTypeSelect,
    isTierFiltered,
    isTypeFiltered,
    getDropdownStyle
  } = useBrowser(type, encounterItems, pcCount, playerTier, filterCustom, customContent)

  // Reset focused row only when search/filters actually change
  const prevSearchRef = useRef(searchTerm)
  const prevTiersRef = useRef(JSON.stringify(selectedTiers))
  const prevTypesRef = useRef(JSON.stringify(selectedTypes))
  
  useEffect(() => {
    const searchChanged = prevSearchRef.current !== searchTerm
    const tiersChanged = prevTiersRef.current !== JSON.stringify(selectedTiers)
    const typesChanged = prevTypesRef.current !== JSON.stringify(selectedTypes)
    
    if (searchChanged || tiersChanged || typesChanged) {
      setFocusedItemId(null)
      prevSearchRef.current = searchTerm
      prevTiersRef.current = JSON.stringify(selectedTiers)
      prevTypesRef.current = JSON.stringify(selectedTypes)
    }
  }, [searchTerm, selectedTiers, selectedTypes])
  
  // Keyboard navigation handler (after useBrowser hook)
  useEffect(() => {
    if (activeTab !== 'adversaries') return // Only enable keyboard nav on adversaries tab
    
    const handleKeyDown = (event) => {
      // Don't handle if user is typing in an input
      const activeElement = document.activeElement
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        // Allow arrow keys and enter to work from search input, but clear focus first
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
          // Blur the input so keyboard nav can work
          if (event.key !== 'Enter' || activeElement.tagName !== 'INPUT') {
            activeElement.blur()
          }
        } else {
          return
        }
      }
      
      const maxIndex = filteredAndSortedData.length - 1
      // Resolve the focused row's current position from its id, so navigation
      // stays correct after the list is filtered or sorted.
      const currentIndex = focusedItemId != null
        ? filteredAndSortedData.findIndex(i => i.id === focusedItemId)
        : -1

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        {
          const next = currentIndex < maxIndex ? currentIndex + 1 : currentIndex
          // Update focused item ID
          if (next >= 0 && next < filteredAndSortedData.length) {
            const nextId = filteredAndSortedData[next]?.id || null
            setFocusedItemId(nextId)
            // Scroll row into view - align bottom of focused row with bottom of container (ArrowDown)
            if (rowRefs.current[nextId]) {
              setTimeout(() => {
                const rowElement = rowRefs.current[nextId]
                if (rowElement) {
                  const container = rowElement.closest('.browser-content')
                  if (container) {
                    const containerRect = container.getBoundingClientRect()
                    const rowRect = rowElement.getBoundingClientRect()
                    
                    // Check if this is a two-part row (has description)
                    const nextSibling = rowElement.nextElementSibling
                    const isTwoPartRow = nextSibling && nextSibling.tagName === 'TR' && 
                                       nextSibling.querySelector('td[colspan]')
                    
                    // Calculate total row height (including description row if present)
                    let totalRowHeight = rowRect.height
                    if (isTwoPartRow) {
                      totalRowHeight += nextSibling.getBoundingClientRect().height
                    }
                    
                    // Check if row is at or near the bottom of visible area
                    const rowBottomRelativeToViewport = rowRect.bottom - containerRect.top
                    const containerHeight = containerRect.height
                    const isAtBottom = rowBottomRelativeToViewport >= containerHeight - 1 // Allow 1px tolerance
                    const isBelowView = rowRect.bottom > containerRect.bottom
                    
                    // Only scroll if row is at bottom or below viewport
                    if (isAtBottom || isBelowView) {
                      // Get the row's offset from the top of the table
                      const rowOffsetTop = rowElement.offsetTop
                      
                      // Position row so its bottom aligns with container bottom
                      // rowOffsetTop + totalRowHeight = scrollTop + containerHeight
                      // Therefore: scrollTop = rowOffsetTop + totalRowHeight - containerHeight
                      let targetScroll = rowOffsetTop + totalRowHeight - containerHeight
                      
                      // Ensure we don't scroll past the bottom
                      const maxScroll = container.scrollHeight - containerHeight
                      targetScroll = Math.min(targetScroll, maxScroll)
                      
                      // Ensure we don't scroll past the top
                      targetScroll = Math.max(0, targetScroll)
                      
                      container.scrollTo({ top: targetScroll, behavior: 'smooth' })
                    }
                  } else {
                    // Fallback to scrollIntoView if container not found
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'end' })
                  }
                }
              }, 0)
            }
          }
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        {
          // If at top or going above top, focus search input
          if (currentIndex <= 0) {
            setFocusedItemId(null)
            // Focus search input
            setTimeout(() => {
              const searchInput = document.querySelector('.browser-header input[type="text"]')
              searchInput?.focus()
            }, 0)
            return
          }

          const next = currentIndex - 1
          // Update focused item ID
          if (next >= 0 && next < filteredAndSortedData.length) {
            const nextId = filteredAndSortedData[next]?.id || null
            setFocusedItemId(nextId)
            // Scroll row into view with custom logic (ArrowUp)
            if (rowRefs.current[nextId]) {
              setTimeout(() => {
                const rowElement = rowRefs.current[nextId]
                if (rowElement) {
                  const container = rowElement.closest('.browser-content')
                  if (container) {
                    const containerRect = container.getBoundingClientRect()
                    const rowRect = rowElement.getBoundingClientRect()
                    
                    // Get header height to account for sticky header
                    const headerHeight = (() => {
                      const table = rowElement.closest('table')
                      const thead = table?.querySelector('thead')
                      return thead ? thead.getBoundingClientRect().height : 0
                    })()
                    
                    // Check if row is at or near the top of visible area (below header)
                    const rowTopRelativeToViewport = rowRect.top - containerRect.top
                    const isAtTop = Math.abs(rowTopRelativeToViewport - headerHeight) <= 1 // Allow 1px tolerance
                    const isAboveView = rowRect.top < containerRect.top
                    
                    // Only scroll if row is above viewport or at/near the top
                    if (isAboveView || isAtTop) {
                      // Check if this is a two-part row (has description)
                      const nextSibling = rowElement.nextElementSibling
                      const isTwoPartRow = nextSibling && nextSibling.tagName === 'TR' && 
                                         nextSibling.querySelector('td[colspan]')
                      
                      // Calculate total row height (including description row if present)
                      let totalRowHeight = rowRect.height
                      if (isTwoPartRow) {
                        totalRowHeight += nextSibling.getBoundingClientRect().height
                      }
                      
                      // Get the row's offset from the top of the table
                      const rowOffsetTop = rowElement.offsetTop
                      
                      // Position row so its top aligns with container top (below header)
                      // rowOffsetTop = scrollTop + headerHeight
                      // Therefore: scrollTop = rowOffsetTop - headerHeight
                      let targetScroll = rowOffsetTop - headerHeight
                      
                      // Ensure we don't scroll past the bottom
                      const maxScroll = container.scrollHeight - container.clientHeight
                      targetScroll = Math.min(targetScroll, maxScroll)
                      
                      // Ensure we don't scroll past the top
                      targetScroll = Math.max(0, targetScroll)
                      
                      container.scrollTo({ top: targetScroll, behavior: 'smooth' })
                    }
                  } else {
                    // Fallback to scrollIntoView if container not found
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }
              }, 0)
            }
          } else {
            setFocusedItemId(null)
          }
        }
      } else if (event.key === 'Enter' && currentIndex >= 0 && currentIndex <= maxIndex) {
        event.preventDefault()
        const focusedItem = filteredAndSortedData[currentIndex]
        if (focusedItem && onAddItem) {
          onAddItem(focusedItem)
          // Keep focus on the same row after adding
          // Focus stays where it is
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeTab, filteredAndSortedData, focusedItemId, onAddItem])

  // Calculate remaining battle points budget — shared logic with EncounterReceipt/DashboardView
  // (BattlePointsCalculator.js), so Colossi are excluded from BP sums here too (#99).
  const calculateRemainingBudget = () => {
    const baseBattlePoints = calculateBaseBattlePoints(pcCount)
    const spentBattlePoints = calculateSpentBattlePoints(encounterItems, pcCount)
    const automaticAdjustments = calculateAutomaticAdjustments(encounterItems)
    const availableBattlePoints = baseBattlePoints + automaticAdjustments
    return availableBattlePoints - spentBattlePoints
  }

  const remainingBudget = calculateRemainingBudget()

  if (loading) {
    return (
      <div style={styles.browser}>
        <div style={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div style={showContainer ? styles.browserWrapper : styles.browserWrapperNoContainer}>
      {/* Fixed Header Row */}

      {activeTab === 'adversaries' && (
        <>
          <BrowserHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            type={type}
            partyControls={partyControls}
            autoFocus={autoFocus}
            onClose={onClose}
            placeholder={searchPlaceholder}
            remainingBudget={type === 'adversary' ? remainingBudget : null}
          />
          {!hideImportExport && (
          <BrowserButtonRow
            showCustomToggle={showCustomToggle}
            onToggleCustom={onToggleCustom}
            filterCustom={filterCustom}
            onExportCustomAdversaries={handleExportCustomAdversaries}
            onImportCustomAdversaries={handleImportCustomAdversaries}
          />
          )}

          {/* Scrollable Content with Sticky Header */}
          <div className="browser-content invisible-scrollbar" style={styles.browserContent}>
        <table style={styles.browserTable}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-primary)' }}>
            <BrowserTableHeader
              sortFields={sortFields}
              onSort={handleSort}
              type={type}
              uniqueTiers={uniqueTiers}
              uniqueTypes={uniqueTypes}
              selectedTiers={selectedTiers}
              selectedTypes={selectedTypes}
              showTierDropdown={showTierDropdown}
              setShowTierDropdown={setShowTierDropdown}
              showTypeDropdown={showTypeDropdown}
              setShowTypeDropdown={setShowTypeDropdown}
              tierFilterRef={tierFilterRef}
              typeFilterRef={typeFilterRef}
              handleTierSelect={handleTierSelect}
              handleTypeSelect={handleTypeSelect}
              isTierFiltered={isTierFiltered}
              isTypeFiltered={isTypeFiltered}
              getDropdownStyle={getDropdownStyle}
            />
          </thead>
          <tbody>
            {filteredAndSortedData.map((item) => {
              return (
                <BrowserRow
                  key={item.id}
                  item={item}
                  onAdd={onAddItem}
                  type={type}
                  onRowClick={onRowClick}
                  encounterItems={encounterItems}
                  pcCount={pcCount}
                  playerTier={playerTier}
                  remainingBudget={remainingBudget}
                  isFocused={focusedItemId === item.id}
                  onDeleteCustomAdversary={type === 'adversary' ? handleDeleteCustomAdversary : null}
                  isDeleteConfirmed={deleteAdversaryConfirmations[item.id] || false}
                  rowRef={(el) => {
                    if (el) {
                      rowRefs.current[item.id] = el
                    } else {
                      delete rowRefs.current[item.id]
                    }
                  }}
                />
              )
            })}
          </tbody>
        </table>
      </div>
        </>
      )}

      {activeTab === 'encounters' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {savedEncounters.length === 0 ? (
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '2rem 1rem'
            }}>
              No saved encounters yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {savedEncounters.map((encounter) => (
                <div
                  key={encounter.id}
                  onClick={() => onLoadEncounter && onLoadEncounter(encounter.id)}
                  className="saved-encounter-card"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    backgroundColor: 'var(--bg-card)',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  {/* Tier, Party Size, and Balance (stacked vertically) */}
                  <div style={{ 
                    minWidth: '100px',
                    borderRight: '1px solid var(--text-secondary)',
                    paddingRight: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: '60px'
                  }}>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      Tier: {(() => {
                        const tiers = encounter.encounterItems
                          ?.filter(item => item.type === 'adversary')
                          ?.map(item => item.item.tier)
                          ?.filter(tier => tier !== undefined && tier !== null)
                          ?.sort((a, b) => a - b) || []
                        
                        if (tiers.length === 0) return 'N/A'
                        if (tiers.length === 1) return tiers[0]
                        
                        const uniqueTiers = [...new Set(tiers)]
                        if (uniqueTiers.length === 1) return uniqueTiers[0]
                        
                        return `${Math.min(...uniqueTiers)}-${Math.max(...uniqueTiers)}`
                      })()}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      Party Size: {encounter.partySize || 4}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)'
                    }}>
                      Balance: {(() => {
                        const partySize = encounter.partySize || 4
                        const encounterItems = encounter.encounterItems || []
                        const baseBattlePoints = calculateBaseBattlePoints(partySize)
                        const automaticAdjustments = calculateAutomaticAdjustments(encounterItems)
                        const availableBattlePoints = baseBattlePoints + automaticAdjustments
                        const spentBattlePoints = calculateSpentBattlePoints(encounterItems, partySize)

                        if (spentBattlePoints > availableBattlePoints) {
                          return `+${spentBattlePoints - availableBattlePoints}`
                        } else if (spentBattlePoints === availableBattlePoints) {
                          return '0'
                        } else {
                          return `-${availableBattlePoints - spentBattlePoints}`
                        }
                      })()}
                    </div>
                  </div>
                  
                  {/* Encounter Name */}
                  <div style={{ 
                    minWidth: '120px',
                    borderRight: '1px solid var(--text-secondary)',
                    paddingRight: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '60px'
                  }}>
                    <div style={{
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      width: '150px',
                      maxWidth: '150px'
                    }}>
                      {encounter.name}
                    </div>
                  </div>
                  
                  {/* Adversary List */}
                  <AdversaryList encounter={encounter} />
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click
                      handleDeleteClick(encounter.id)
                    }}
                    style={{
                      background: deleteConfirmations[encounter.id] ? 'var(--danger)' : 'var(--gray-600)',
                      border: 'none',
                      color: 'white',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      minWidth: '60px',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          height: '100%',
          minHeight: 0
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '0',
            overflowY: 'visible',
            overflowX: 'hidden',
            minHeight: 0
          }}>
        <CustomAdversaryCreator 
          onSave={handleSaveAdversary}
          onRefresh={() => {}} // No need to refresh since state updates automatically
          onAddItem={onAddItem}
          editingAdversary={editingAdversary}
          onCancelEdit={handleCancelEdit}
              embedded={false}
        />
          </div>
        </div>
      )}


    </div>
    </>
  )
}

// Export custom content management functions
export { 
  updateCustomContent, 
  deleteCustomContent,
  loadCustomContent,
  saveCustomContent
}

export default Browser
export { BrowserRow }