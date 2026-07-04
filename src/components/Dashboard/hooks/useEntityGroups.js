import { useCallback, useMemo } from 'react'
import { applySort, getGroupLabel } from './useDashboardSortGroup'
import { numberSegmentInstances } from '../../Adversaries/GameCard/ColossusSegmentCard'

// Expand a colossus group into one pseudo-group per segment ROLE (e.g. one
// "Foreleg" group for Daktadae's 2 Forelegs, not two), all sharing a
// groupName so EntityColumns' existing section-grouping keeps them visually
// adjacent on the board. Deleting the underlying colossus instance removes
// every segment card together, since they all reference the same
// group/instance data rather than owning separate state.
//
// Each role's instances carry a running `instanceNumber`, shared across the
// whole colossus (not restarting per segment role) — e.g. Head=1, Torso=2,
// Foreleg A=3, Foreleg B=4 — following the same `sortSegments` order as the
// nested display mode (#109). Same-role instances are consolidated into a
// single pseudo-group carrying all of that role's numbered instances (#110)
// so the card renders fixed instance slots instead of separate cards.
const expandColossusIntoSegmentGroups = (group) => {
  const inst = group.instances[0]
  const numbered = numberSegmentInstances(group.segments)

  const byRole = new Map()
  numbered.forEach(({ seg, instanceKey, instanceNumber }) => {
    if (!byRole.has(seg.id)) byRole.set(seg.id, { seg, instances: [] })
    byRole.get(seg.id).instances.push({ instanceKey, instanceNumber })
  })

  return Array.from(byRole.values()).map(({ seg, instances: segInstances }) => ({
    type: 'adversary',
    baseName: `${group.baseName}::${seg.id}`,
    template: group,
    instances: group.instances,
    groupName: `colossus: ${group.baseName.toLowerCase()}`,
    isColossusSegment: true,
    segment: seg,
    segmentInstances: segInstances,
    colossusInstanceId: inst?.id,
  }))
}

// Colossi never get add/remove instance buttons in either display mode (#96)
// — true for both the nested card and each segment-mode pseudo-group.
export const isColossusGroup = (group) =>
  group.type === 'adversary' && (group.template?.isColossus || group.isColossusSegment)

// Builds the `item` prop for an adversary group's GameCard. Segment pseudo-groups
// synthesize a unique baseName (#108) — use group.template.baseName for display
// instead. group.template already carries colossusStressMax (set at creation
// time in useAdversaryState.js, #109); hp/stress are zeroed here since those
// keys mean something different for the (unrelated) adversary-instance convention.
export const buildAdversaryItem = (group) => ({
  ...group.template,
  name: group.isColossusSegment ? group.template?.baseName : group.baseName,
  hp: 0, stress: 0, isDead: false,
})

/**
 * Builds the ordered list of entity groups (environments + adversaries) for
 * the rendering layer. Environments always appear first with a fixed groupName
 * of "environment: [type]". Adversaries follow with optional grouping.
 */
export const useEntityGroups = (adversaryGroups, environments = [], sortBy = 'name', sortDir = 'asc', groupBy = 'type', colossusDisplayMode = 'nested') => {
  const getEntityGroups = useCallback(() => {
    // Environments always come first, sorted by type then name, always grouped
    const envGroups = [...environments]
      .sort((a, b) => {
        const tc = (a.type || '').localeCompare(b.type || '')
        return tc !== 0 ? tc : (a.name || '').localeCompare(b.name || '')
      })
      .map((env) => ({
        type: 'environment',
        baseName: env.name,
        template: env,
        instances: [env],
        groupName: `environment: ${(env.type || 'unknown').toLowerCase()}`,
      }))

    const sortedAdversaryGroups = applySort(adversaryGroups, sortBy, sortDir, groupBy)
    const advGroups = sortedAdversaryGroups.flatMap((group) => {
      if (group.isColossus && colossusDisplayMode === 'segments') {
        return expandColossusIntoSegmentGroups(group)
      }
      return [{
        type: 'adversary',
        baseName: group.baseName,
        template: group,
        instances: group.instances,
        groupName: getGroupLabel(group, groupBy),
      }]
    })

    return [...envGroups, ...advGroups]
  }, [adversaryGroups, environments, sortBy, sortDir, groupBy, colossusDisplayMode])

  const entityGroups = useMemo(() => getEntityGroups(), [getEntityGroups])

  return { entityGroups, getEntityGroups }
}
