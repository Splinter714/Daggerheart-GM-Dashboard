import { renderHook } from '@testing-library/react'
import { useEntityGroups } from './useEntityGroups'

const colossusGroup = {
  id: 'grp-1',
  baseName: 'Ikeri',
  type: 'adversary',
  isColossus: true,
  tier: 1,
  segments: [
    { id: 'ikeri-head', name: 'Head', role: 'head', count: 1, hp: 5, difficulty: 16 },
    { id: 'ikeri-arm', name: 'Arm', role: 'arm', count: 2, hp: 4, difficulty: 14 },
  ],
  instances: [{ id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true, segmentHp: {} }],
}

const regularGroup = {
  id: 'grp-2',
  baseName: 'Goblin',
  type: 'adversary',
  instances: [{ id: 'adv-2', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true }],
}

describe('useEntityGroups colossus display modes', () => {
  it('nested mode (default) renders the colossus as a single entity group', () => {
    const { result } = renderHook(() => useEntityGroups([colossusGroup, regularGroup]))
    const colossusEntries = result.current.entityGroups.filter(g => g.baseName === 'Ikeri')
    expect(colossusEntries).toHaveLength(1)
    expect(colossusEntries[0].segment).toBeUndefined()
  })

  it('segments mode expands a colossus into one pseudo-group per segment instance', () => {
    const { result } = renderHook(() =>
      useEntityGroups([colossusGroup, regularGroup], [], 'name', 'asc', 'none', 'segments')
    )
    const segmentEntries = result.current.entityGroups.filter(g => g.isColossusSegment)
    // 1 Head + 2 Arms (count: 2) = 3 segment cards
    expect(segmentEntries).toHaveLength(3)
    expect(segmentEntries.map(e => e.segmentKey)).toEqual(['ikeri-head', 'ikeri-arm-1', 'ikeri-arm-2'])
  })

  it('keeps all segment cards for one colossus grouped under the same groupName (stay adjacent)', () => {
    const { result } = renderHook(() =>
      useEntityGroups([colossusGroup, regularGroup], [], 'name', 'asc', 'none', 'segments')
    )
    const segmentEntries = result.current.entityGroups.filter(g => g.isColossusSegment)
    const groupNames = new Set(segmentEntries.map(e => e.groupName))
    expect(groupNames.size).toBe(1)
  })

  it('does not expand non-colossus adversary groups', () => {
    const { result } = renderHook(() =>
      useEntityGroups([colossusGroup, regularGroup], [], 'name', 'asc', 'none', 'segments')
    )
    const goblinEntries = result.current.entityGroups.filter(g => g.baseName === 'Goblin')
    expect(goblinEntries).toHaveLength(1)
    expect(goblinEntries[0].isColossusSegment).toBeUndefined()
  })

  it('segment pseudo-groups share the same underlying instances as the colossus (deleting it removes all segment cards)', () => {
    const { result } = renderHook(() =>
      useEntityGroups([colossusGroup, regularGroup], [], 'name', 'asc', 'none', 'segments')
    )
    const segmentEntries = result.current.entityGroups.filter(g => g.isColossusSegment)
    segmentEntries.forEach(entry => {
      expect(entry.instances[0].id).toBe('adv-1')
    })
  })
})
