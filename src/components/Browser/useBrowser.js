import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  loadData as loadDataLibrary,
  reloadData,
  updateCustomContent as updateCustomContentLibrary,
  deleteCustomContent as deleteCustomContentLibrary,
  adversariesData as libraryAdversariesData,
  environmentsData as libraryEnvironmentsData
} from './DataLibrary'
import { BATTLE_POINT_COSTS } from '../Dashboard/BattlePointsCalculator'

// Browser data layer + filtering/sorting hook. Extracted verbatim from Browser.jsx (Phase 4).
// The mutable module-level adversariesData/environmentsData live here WITH the hook that
// reassigns them — ES module live bindings can't be reassigned by an importer.
let adversariesData = libraryAdversariesData
let environmentsData = libraryEnvironmentsData

// Wrapper functions that update local references
const loadData = async () => {
  const data = await loadDataLibrary()
  adversariesData = data.adversariesData
  environmentsData = data.environmentsData
}

export const updateCustomContent = async (type, id, updates) => {
  const data = await updateCustomContentLibrary(type, id, updates)
  adversariesData = data.adversariesData
  environmentsData = data.environmentsData
}

export const deleteCustomContent = async (type, id) => {
  const data = await deleteCustomContentLibrary(type, id)
  adversariesData = data.adversariesData
  environmentsData = data.environmentsData
}

// Custom hook for browser functionality - all logic inline
export const useBrowser = (type, encounterItems = [], pcCount = 4, playerTier = 1, filterCustom = false, customContent = null) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortFields, setSortFields] = useState([{ field: 'tier', direction: 'asc' }, { field: 'name', direction: 'asc' }])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Advanced filtering state
  const [selectedTiers, setSelectedTiers] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [showTierDropdown, setShowTierDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  
  // Refs for dropdown positioning
  const tierFilterRef = useRef(null)
  const typeFilterRef = useRef(null)

  useEffect(() => {
    const initializeData = async () => {
      await loadData()
      setLoading(false)
      
      // Set data after loading is complete
      let sourceData = []
      if (type === 'adversary') {
        sourceData = adversariesData.adversaries || []
      } else if (type === 'environment') {
        sourceData = environmentsData.environments || []
      }
      
      setData(sourceData)
    }
    
    initializeData()
  }, [type])

  // Refresh data when customContent changes (for adversary type)
  useEffect(() => {
    if (type === 'adversary' && customContent) {
      const refreshData = async () => {
        const data = await reloadData()
        adversariesData = data.adversariesData
        environmentsData = data.environmentsData
        
        let sourceData = []
        if (filterCustom) {
          sourceData = (adversariesData.adversaries || []).filter(adv => adv.source === 'Homebrew' || adv.id?.startsWith('custom-'))
        } else {
          sourceData = adversariesData.adversaries || []
        }
        
        setData(sourceData)
      }
      refreshData()
    }
  }, [customContent, type, filterCustom])


  // Get unique values for filtering
  const getUniqueValues = (field) => {
    const values = data.map(item => item[field]).filter(Boolean)
    return [...new Set(values)].sort((a, b) => {
      // Sort numbers numerically, strings alphabetically
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b
      }
      return String(a).localeCompare(String(b))
    })
  }

  // Function to refresh data
  const refreshData = useCallback(async () => {
    const data = await reloadData()
    adversariesData = data.adversariesData
    environmentsData = data.environmentsData
    
    // Update data after reload
    let sourceData = []
    if (type === 'adversary') {
      if (filterCustom) {
        // Filter to only custom adversaries
        sourceData = (adversariesData.adversaries || []).filter(adv => adv.source === 'Homebrew' || adv.id?.startsWith('custom-'))
      } else {
        sourceData = adversariesData.adversaries || []
      }
    } else if (type === 'environment') {
      sourceData = environmentsData.environments || []
    }
    
    setData(sourceData)
  }, [type, filterCustom])

  // Refresh data when filterCustom changes
  useEffect(() => {
    refreshData()
  }, [filterCustom, refreshData])

  const uniqueTiers = getUniqueValues('tier')
  const uniqueTypes = getUniqueValues('type')

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      // Search filter
      const itemName = item.name || item.baseName || ''
      const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Tier filter
      const matchesTier = selectedTiers.length === 0 || selectedTiers.includes(item.tier.toString())
      
      // Type filter
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.type)
      
      return matchesSearch && matchesTier && matchesType
    })

    // Apply multi-level sorting (like archived version)
    filtered.sort((a, b) => {
      for (const sort of sortFields) {
        const { field, direction } = sort
        let aValue = a[field]
        let bValue = b[field]
        
        if (field === 'tier') {
          aValue = parseInt(aValue) || 0
          bValue = parseInt(bValue) || 0
        } else if (field === 'atk') {
          aValue = parseInt(aValue) || 0
          bValue = parseInt(bValue) || 0
        } else if (field === 'cost') {
          // Calculate dynamic cost for sorting
          const calculateDynamicCost = (item) => {
            if (type !== 'adversary') return 0
            
            const baseCost = BATTLE_POINT_COSTS[item.type] || 2
            let automaticAdjustment = 0
            
            // Count current adversaries by type
            const currentSoloCount = encounterItems.filter(encounterItem => 
              encounterItem.type === 'adversary' && encounterItem.item.type === 'Solo' && encounterItem.quantity > 0
            ).reduce((sum, encounterItem) => sum + encounterItem.quantity, 0)
            
            const currentMajorThreatCount = encounterItems.filter(encounterItem => 
              encounterItem.type === 'adversary' && ['Bruiser', 'Horde', 'Leader', 'Solo'].includes(encounterItem.item.type) && encounterItem.quantity > 0
            ).reduce((sum, encounterItem) => sum + encounterItem.quantity, 0)
            
            // Calculate automatic adjustments
            if (item.type === 'Solo') {
              // If this would be the 2nd Solo, add 2 BP (penalty for 2+ Solos)
              if (currentSoloCount === 1) {
                automaticAdjustment += 2
              }
            }
            
            if (['Bruiser', 'Horde', 'Leader', 'Solo'].includes(item.type)) {
              // If this is the first Major Threat, add 1 BP (automatic adjustment for lack of Major Threats)
              if (currentMajorThreatCount === 0) {
                automaticAdjustment += 1
              }
            }
            
        // Lower tier adjustment
        // if (item.tier < playerTier) {
        //   automaticAdjustment += 1
        // }
            
            return baseCost + automaticAdjustment
          }
          
          aValue = calculateDynamicCost(a)
          bValue = calculateDynamicCost(b)
        } else if (field === 'difficulty') {
          // Handle difficulty sorting - numeric difficulties first, then special cases
          const aNum = parseInt(aValue)
          const bNum = parseInt(bValue)
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            // Both are numeric
            aValue = aNum
            bValue = bNum
          } else if (!isNaN(aNum) && isNaN(bNum)) {
            // a is numeric, b is not - numeric comes first
            aValue = aNum
            bValue = 999 // High number to sort after numeric difficulties
          } else if (isNaN(aNum) && !isNaN(bNum)) {
            // b is numeric, a is not - numeric comes first
            aValue = 999 // High number to sort after numeric difficulties
            bValue = bNum
          } else {
            // Both are non-numeric, sort alphabetically
            aValue = String(aValue || '').toLowerCase()
            bValue = String(bValue || '').toLowerCase()
          }
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        } else {
          // Handle non-string values by converting to strings
          aValue = String(aValue || '').toLowerCase()
          bValue = String(bValue || '').toLowerCase()
        }
        
        if (direction === 'asc') {
          if (aValue > bValue) return 1
          if (aValue < bValue) return -1
        } else {
          if (aValue < bValue) return 1
          if (aValue > bValue) return -1
        }
        // If equal, continue to next sort level
      }
      return 0
    })

    return filtered
  }, [data, searchTerm, sortFields, selectedTiers, selectedTypes, encounterItems, pcCount, playerTier])

  const handleSort = (field) => {
    setSortFields(prev => {
      // Check if this field is already in the sort fields
      const existingIndex = prev.findIndex(sort => sort.field === field)
      
      if (existingIndex >= 0) {
        // Field exists - check if it's the primary field
        if (existingIndex === 0) {
          // It's the primary field - toggle direction
          const newSortFields = [...prev]
          newSortFields[0] = {
            ...newSortFields[0],
            direction: newSortFields[0].direction === 'asc' ? 'desc' : 'asc'
          }
          return newSortFields
        } else {
          // It's not the primary field - move it to primary position and reset to asc
          const newSortFields = [...prev]
          const existingSort = newSortFields.splice(existingIndex, 1)[0]
          return [{ field, direction: 'asc' }, ...newSortFields]
        }
      } else {
        // Field doesn't exist - add it as new primary sort
        return [{ field, direction: 'asc' }, ...prev]
      }
    })
  }

  const handleTierSelect = (tier) => {
    if (tier === 'clear') {
      setSelectedTiers([])
    } else {
      setSelectedTiers(prev => 
        prev.includes(tier) 
          ? prev.filter(t => t !== tier)
          : [...prev, tier]
      )
    }
    // Don't close dropdown - allow multiple selections
  }

  const handleTypeSelect = (type) => {
    if (type === 'clear') {
      setSelectedTypes([])
    } else {
      setSelectedTypes(prev => 
        prev.includes(type) 
          ? prev.filter(t => t !== type)
          : [...prev, type]
      )
    }
    // Don't close dropdown - allow multiple selections
  }

  const isTierFiltered = selectedTiers.length > 0
  const isTypeFiltered = selectedTypes.length > 0

  // Close dropdowns on outside click
  useEffect(() => {
    const handleGlobalDown = (event) => {
      const inDropdown = event.target.closest('.filter-dropdown')
      const onFilterButton = event.target.closest('.header-filter-icon')
      if (inDropdown || onFilterButton) return
      setShowTierDropdown(false)
      setShowTypeDropdown(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setShowTierDropdown(false)
        setShowTypeDropdown(false)
      }
    }

    document.addEventListener('pointerdown', handleGlobalDown, true)
    document.addEventListener('mousedown', handleGlobalDown, true)
    document.addEventListener('touchstart', handleGlobalDown, true)
    document.addEventListener('click', handleGlobalDown, true)
    document.addEventListener('keydown', handleKey, true)
    return () => {
      document.removeEventListener('pointerdown', handleGlobalDown, true)
      document.removeEventListener('mousedown', handleGlobalDown, true)
      document.removeEventListener('touchstart', handleGlobalDown, true)
      document.removeEventListener('click', handleGlobalDown, true)
      document.removeEventListener('keydown', handleKey, true)
    }
  }, [setShowTierDropdown, setShowTypeDropdown])

  // Get dropdown positioning
  const getDropdownStyle = (ref) => {
    if (!ref.current) return {}
    const rect = ref.current.getBoundingClientRect()
    return {
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left - 100, // Align with left side of column instead of button
      zIndex: 99999
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    sortFields,
    handleSort,
    filteredAndSortedData,
    loading,
    refreshData,    // Advanced filtering
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
  }
}
