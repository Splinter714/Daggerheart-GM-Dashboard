import { describe, it, expect } from 'vitest'
import { groupsToEncounterItems } from './RightColumn'

describe('groupsToEncounterItems', () => {
  it('groups a regular adversary into a single quantified encounterItem', () => {
    const groups = [
      { id: 'grp1', baseName: 'Goblin', type: 'Standard', instances: [{ id: 'a1' }, { id: 'a2' }] },
    ]
    const items = groupsToEncounterItems(groups, 4)
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
    expect(items[0].item.name).toBe('Goblin')
  })

  it('groups minions into BP-equivalent groups based on party size, and reports the raw instance count separately (#87)', () => {
    const groups = [
      { id: 'grp1', baseName: 'Minion Swarm', type: 'Minion', instances: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }, { id: 'a4' }] },
    ]
    const items = groupsToEncounterItems(groups, 4)
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(1)
    expect(items[0].instanceCount).toBe(4)
  })

  it('expands a colossus group into one separate encounterItem per instance, never grouped (#99)', () => {
    const groups = [
      {
        id: 'grp1',
        baseName: 'Ikeri, Injuries Untold',
        type: 'Colossus',
        isColossus: true,
        instances: [{ id: 'inst1', duplicateNumber: 1 }, { id: 'inst2', duplicateNumber: 2 }],
      },
    ]
    const items = groupsToEncounterItems(groups, 4)
    expect(items).toHaveLength(2)
    items.forEach((item) => {
      expect(item.quantity).toBe(1)
      expect(item.item.name).toBe('Ikeri, Injuries Untold')
      expect(item.item.type).toBe('Colossus')
    })
    expect(items[0].item.id).toBe('inst1')
    expect(items[1].item.id).toBe('inst2')
  })
})
