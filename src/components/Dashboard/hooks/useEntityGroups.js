import { useCallback, useMemo } from 'react'
import { applySort, getGroupLabel } from './useDashboardSortGroup'
import { sortSegments } from '../../Adversaries/GameCard/ColossusSegmentCard'

// Expand a colossus group into one pseudo-group per segment instance, all
// sharing a groupName so EntityColumns' existing section-grouping keeps them
// visually adjacent on the board. Deleting the underlying colossus instance
// removes every segment card together, since they all reference the same
// group/instance data rather than owning separate state.
const expandColossusIntoSegmentGroups = (group) => {
  const inst = group.instances[0]
  return sortSegments(group.segments).flatMap((seg) => {
    const count = seg.count || 1
    return Array.from({ length: count }, (_, idx) => {
      const segmentKey = count > 1 ? `${seg.id}-${idx + 1}` : seg.id
      return {
        type: 'adversary',
        baseName: `${group.baseName}::${segmentKey}`,
        template: group,
        instances: group.instances,
        groupName: `colossus: ${group.baseName.toLowerCase()}`,
        isColossusSegment: true,
        segment: seg,
        segmentKey,
        colossusInstanceId: inst?.id,
      }
    })
  })
}

// Colossi never get add/remove instance buttons in either display mode (#96)
// — true for both the nested card and each segment-mode pseudo-group.
export const isColossusGroup = (group) =>
  group.type === 'adversary' && (group.template?.isColossus || group.isColossusSegment)

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
