import { useCallback, useMemo } from 'react'
import { applySort, getGroupLabel } from './useDashboardSortGroup'
import { numberSegmentInstances } from '../../Adversaries/GameCard/ColossusSegmentCard'

// Expand a colossus group into one pseudo-group per segment instance, all
// sharing a groupName so EntityColumns' existing section-grouping keeps them
// visually adjacent on the board. Deleting the underlying colossus instance
// removes every segment card together, since they all reference the same
// group/instance data rather than owning separate state.
//
// Each segment instance also carries a running `instanceNumber`, shared
// across the whole colossus (not restarting per segment role) — e.g.
// Head=1, Torso=2, Arm A=3, Arm B=4 — following the same `sortSegments`
// order as the nested display mode (#109).
const expandColossusIntoSegmentGroups = (group) => {
  const inst = group.instances[0]
  return numberSegmentInstances(group.segments).map(({ seg, instanceKey, instanceNumber }) => ({
    type: 'adversary',
    baseName: `${group.baseName}::${instanceKey}`,
    template: group,
    instances: group.instances,
    groupName: `colossus: ${group.baseName.toLowerCase()}`,
    isColossusSegment: true,
    segment: seg,
    segmentKey: instanceKey,
    instanceNumber,
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
