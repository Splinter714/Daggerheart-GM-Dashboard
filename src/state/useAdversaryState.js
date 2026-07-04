// Adversary state management module
// Internal model: groups (one per baseName), each with shared template fields + instances array
// External model: flat adversaries array (backward compat) computed from groups
import { useState, useEffect, useRef, useMemo } from 'react'
import { generateId, readFromStorage, writeToStorage } from './StorageHelpers'

// Per-instance fields — everything else lives on the group template
// segmentHp tracks colossus per-segment HP pips per instance (colossi don't
// stack, but the value still lives on the instance alongside hp/stress).
// segmentTokens tracks the "place a token" / "Broken until cleared" counters
// some colossus segments use (e.g. Daktadae's Head/Forelegs/Hindlegs, #97).
const INSTANCE_FIELDS = new Set(['hp', 'stress', 'isVisible', 'segmentHp', 'segmentTokens'])

// Migrate old flat-array format → group format
const migrateToGroups = (flatAdversaries) => {
  const groupMap = {}

  flatAdversaries.forEach((adv) => {
    const baseName = adv.baseName || adv.name?.replace(/\s+\(\d+\)$/, '') || adv.name || 'Unknown'

    if (!groupMap[baseName]) {
      const { hp, stress, isVisible, duplicateNumber, name, id: _id, ...template } = adv
      groupMap[baseName] = {
        ...template,
        id: generateId('grp'),
        baseName,
        instances: [],
      }
    }

    groupMap[baseName].instances.push({
      id: adv.id,
      duplicateNumber: adv.duplicateNumber || 1,
      hp: adv.hp || 0,
      stress: adv.stress || 0,
      isVisible: adv.isVisible !== false,
    })
  })

  Object.values(groupMap).forEach((group) => {
    group.instances.sort((a, b) => (a.duplicateNumber || 1) - (b.duplicateNumber || 1))
  })

  return Object.values(groupMap)
}

const isOldFormat = (data) => {
  if (!Array.isArray(data) || data.length === 0) return false
  return !Array.isArray(data[0]?.instances)
}

const flattenGroups = (groups) =>
  groups.flatMap((group) => {
    const { instances, ...template } = group
    return instances.map((inst) => ({
      ...template,
      ...inst,
      name:
        inst.duplicateNumber === 1
          ? group.baseName
          : `${group.baseName} (${inst.duplicateNumber})`,
    }))
  })

export function useAdversaryState(initialAdversaries = []) {
  const [groups, setGroups] = useState(() => {
    if (initialAdversaries.length === 0) return []
    if (isOldFormat(initialAdversaries)) return migrateToGroups(initialAdversaries)
    return initialAdversaries
  })

  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const savedState = readFromStorage('daggerheart-game-state') || {}
    writeToStorage('daggerheart-game-state', { ...savedState, adversaries: groups })
  }, [groups])

  // Flat adversaries — backward compat for all consumers
  const adversaries = useMemo(() => flattenGroups(groups), [groups])

  const initSegmentHp = (segments) => {
    const hp = {}
    for (const seg of segments || []) {
      for (let i = 1; i <= (seg.count || 1); i++) {
        const key = (seg.count || 1) > 1 ? `${seg.id}-${i}` : seg.id
        hp[key] = 0
      }
    }
    return hp
  }

  const createAdversary = (adversaryData) => {
    const baseName =
      adversaryData.baseName ||
      adversaryData.name?.replace(/\s+\(\d+\)$/, '') ||
      adversaryData.name ||
      'Unknown'

    setGroups((prev) => {
      const existingGroup = prev.find((g) => g.baseName === baseName)

      if (existingGroup) {
        const usedNumbers = existingGroup.instances.map((i) => i.duplicateNumber || 1)
        let next = 1
        while (usedNumbers.includes(next)) next++

        const newInstance = { id: generateId('adv'), duplicateNumber: next, hp: 0, stress: 0, isVisible: true }
        if (adversaryData.isColossus) newInstance.segmentHp = initSegmentHp(adversaryData.segments)

        return prev.map((g) =>
          g.baseName === baseName
            ? { ...g, instances: [...g.instances, newInstance] }
            : g
        )
      } else {
        const { hp, stress, isVisible, duplicateNumber, name, id: _id, ...template } = adversaryData
        return [
          ...prev,
          {
            ...template,
            // For colossi, `stress` on the raw data is the framework stress-track
            // length (colossi.json), not an instance value — preserve it under a
            // distinct key since `stress` above is stripped as an instance field (#109).
            ...(adversaryData.isColossus ? { colossusStressMax: stress } : {}),
            id: generateId('grp'),
            baseName,
            instances: [
              { id: generateId('adv'), duplicateNumber: 1, hp: 0, stress: 0, isVisible: true,
                ...(adversaryData.isColossus ? { segmentHp: initSegmentHp(adversaryData.segments) } : {}) },
            ],
          },
        ]
      }
    })
  }

  const createAdversariesBulk = (adversaryDataArray) => {
    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, instances: [...g.instances] }))

      adversaryDataArray.forEach((adversaryData) => {
        const baseName =
          adversaryData.baseName ||
          adversaryData.name?.replace(/\s+\(\d+\)$/, '') ||
          adversaryData.name ||
          'Unknown'

        const idx = next.findIndex((g) => g.baseName === baseName)

        if (idx !== -1) {
          const usedNumbers = next[idx].instances.map((i) => i.duplicateNumber || 1)
          let dupNum = 1
          while (usedNumbers.includes(dupNum)) dupNum++
          next[idx].instances.push({ id: generateId('adv'), duplicateNumber: dupNum, hp: 0, stress: 0, isVisible: true })
        } else {
          const { hp, stress, isVisible, duplicateNumber, name, id: _id, ...template } = adversaryData
          next.push({
            ...template,
            ...(adversaryData.isColossus ? { colossusStressMax: stress } : {}),
            id: generateId('grp'),
            baseName,
            instances: [{ id: generateId('adv'), duplicateNumber: 1, hp: 0, stress: 0, isVisible: true }],
          })
        }
      })

      return next
    })
  }

  // Smart routing: hp/stress/isVisible → instance; everything else → group template
  // Accepts either a group ID (grp-xxx) or an instance ID (adv-xxx)
  const updateAdversary = (id, updates) => {
    const instanceUpdates = {}
    const templateUpdates = {}

    Object.entries(updates).forEach(([key, val]) => {
      if (INSTANCE_FIELDS.has(key)) {
        instanceUpdates[key] = val
      } else {
        templateUpdates[key] = val
      }
    })

    setGroups((prev) =>
      prev.map((group) => {
        const isGroupId = group.id === id
        const instanceIndex = isGroupId ? -1 : group.instances.findIndex((i) => i.id === id)

        if (!isGroupId && instanceIndex === -1) return group

        let updated = { ...group, instances: [...group.instances] }

        if (Object.keys(templateUpdates).length > 0) {
          updated = { ...updated, ...templateUpdates, instances: updated.instances }
        }

        if (instanceIndex !== -1 && Object.keys(instanceUpdates).length > 0) {
          updated.instances = group.instances.map((inst, i) =>
            i === instanceIndex ? { ...inst, ...instanceUpdates } : inst
          )
        }

        return updated
      })
    )
  }

  const deleteAdversary = (instanceId) => {
    setGroups((prev) =>
      prev
        .map((group) => ({
          ...group,
          instances: group.instances.filter((i) => i.id !== instanceId),
        }))
        .filter((group) => group.instances.length > 0)
    )
  }

  return {
    adversaries,
    groups,
    createAdversary,
    createAdversariesBulk,
    updateAdversary,
    deleteAdversary,
  }
}
