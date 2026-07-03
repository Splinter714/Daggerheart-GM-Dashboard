import { readFromStorage, writeToStorage } from '../../../state/StorageHelpers'
import { useState, useEffect } from 'react'
import { TYPE_ORDER } from '../constants'

const STORAGE_KEY = 'daggerheart-dashboard-sort-group'

const DEFAULTS = {
  sortBy: 'name',
  sortDir: 'asc',
  groupBy: 'type',
  // Global toggle: how colossus adversaries render on the board.
  // 'nested' — one card containing all segments (current default, works well on mobile).
  // 'segments' — each segment renders as its own card, grouped/adjacent on the board.
  colossusDisplayMode: 'nested',
}

export function useDashboardSortGroup() {
  const [settings, setSettings] = useState(() => {
    const stored = readFromStorage(STORAGE_KEY)
    if (!stored) return DEFAULTS
    // Migrate old format (sortBy: 'name-asc') to new format
    if (stored.sortBy && stored.sortBy.includes('-')) {
      const [field, dir] = stored.sortBy.split('-')
      return { ...DEFAULTS, sortBy: field, sortDir: dir || 'asc', groupBy: stored.groupBy || 'type' }
    }
    return { ...DEFAULTS, ...stored }
  })

  useEffect(() => {
    writeToStorage(STORAGE_KEY, settings)
  }, [settings])

  // Clicking the same field toggles direction; clicking a new field starts ascending
  const setSortBy = (field) => setSettings(s => ({
    ...s,
    sortBy: field,
    sortDir: s.sortBy === field ? (s.sortDir === 'asc' ? 'desc' : 'asc') : 'asc',
  }))

  const setGroupBy = (groupBy) => setSettings(s => ({ ...s, groupBy }))

  const setColossusDisplayMode = (colossusDisplayMode) => setSettings(s => ({ ...s, colossusDisplayMode }))

  return { ...settings, setSortBy, setGroupBy, setColossusDisplayMode }
}

const SORT_FIELD_KEY = {
  name: 'baseName',
  tier: 'tier',
  type: 'type',
  hp: 'hpMax',
  difficulty: 'difficulty',
  atk: 'atk',
  threshold: null, // handled specially
}

function getSortValue(group, sortBy) {
  switch (sortBy) {
    case 'name': return (group.baseName || '').toLowerCase()
    case 'tier': return group.tier ?? 0
    case 'type': { const idx = TYPE_ORDER.indexOf(group.type); return idx === -1 ? 999 : idx }
    case 'hp': return group.hpMax ?? 0
    case 'difficulty': return group.difficulty ?? 0
    case 'atk': return group.atk ?? 0
    case 'threshold': return group.thresholds?.major ?? group.damageThreshold ?? 0
    default: return (group.baseName || '').toLowerCase()
  }
}

export function applySort(adversaryGroups, sortBy, sortDir, groupBy = 'none') {
  return [...adversaryGroups].sort((a, b) => {
    // When grouping is active, sort by the group field first so same-group
    // entries are always adjacent — sortBy acts as the secondary (within-group) key.
    if (groupBy !== 'none') {
      const groupField = groupBy === 'tier' ? 'tier' : 'type'
      if (groupField !== sortBy) {
        const ag = getSortValue(a, groupField)
        const bg = getSortValue(b, groupField)
        const gcmp = typeof ag === 'string' ? ag.localeCompare(bg) : ag - bg
        if (gcmp !== 0) return gcmp
      }
    }
    // Primary (or secondary when grouping) sort
    const av = getSortValue(a, sortBy)
    const bv = getSortValue(b, sortBy)
    let cmp
    if (typeof av === 'string' && typeof bv === 'string') {
      cmp = av.localeCompare(bv)
    } else {
      cmp = av - bv
    }
    return sortDir === 'desc' ? -cmp : cmp
  })
}

export function getGroupLabel(group, groupBy) {
  if (groupBy === 'tier') return `Tier ${group.tier ?? '?'}`
  if (groupBy === 'type') return group.type || 'Unknown'
  return null
}
