import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RightColumn, { groupsToEncounterItems } from './RightColumn'

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

describe('RightColumn Settings panel (#111: sort/group-by consolidated here)', () => {
  const baseProps = {
    open: true,
    mode: 'info',
    columnWidth: 320,
    onClose: () => {},
    browserContentType: 'adversary',
    browserActiveTab: 'adversaries',
    onTabChange: () => {},
    selectedCustomAdversaryId: null,
    onSelectCustomAdversary: () => {},
    onAddAdversaryFromBrowser: () => {},
    onAddEnvironmentFromBrowser: () => {},
    pcCount: 4,
    updatePartySize: () => {},
    adversaryGroups: [],
    createAdversary: () => {},
    createAdversariesBulk: () => {},
    deleteAdversary: () => {},
    bpAdjustments: {},
    onChangeBpAdjustments: () => {},
    availableBattlePoints: 14,
    spentBattlePoints: 0,
    sortBy: 'name',
    sortDir: 'asc',
    groupBy: 'type',
    onSortBy: vi.fn(),
    onGroupBy: vi.fn(),
    colossusDisplayMode: 'nested',
    onColossusDisplayModeChange: vi.fn(),
    instanceLabelStyle: 'numeric',
    onInstanceLabelStyleChange: vi.fn(),
  }

  it('labels the panel header "Settings" now that it holds real configuration', () => {
    render(<RightColumn {...baseProps} />)
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('renders sort-by and group-by controls alongside Colossus display and Instance labels', () => {
    render(<RightColumn {...baseProps} />)
    expect(screen.getByText('Sort by')).toBeTruthy()
    expect(screen.getByText('Group by')).toBeTruthy()
    expect(screen.getByText('Colossus display')).toBeTruthy()
    expect(screen.getByText('Instance labels')).toBeTruthy()
    // Type appears once under Sort by and once under Group by.
    expect(screen.getAllByText('Type').length).toBeGreaterThanOrEqual(2)
  })

  it('clicking a sort option calls onSortBy with that field', () => {
    render(<RightColumn {...baseProps} />)
    fireEvent.click(screen.getByText('Max HP'))
    expect(baseProps.onSortBy).toHaveBeenCalledWith('hp')
  })

  it('clicking a group option calls onGroupBy with that field', () => {
    render(<RightColumn {...baseProps} />)
    // "Tier" appears under both Sort by and Group by — the second occurrence is Group by's.
    const tierOptions = screen.getAllByText('Tier')
    fireEvent.click(tierOptions[tierOptions.length - 1])
    expect(baseProps.onGroupBy).toHaveBeenCalledWith('tier')
  })
})

describe('RightColumn Encounter List (#55: add-instance pulse wiring)', () => {
  const baseProps = {
    open: true,
    mode: 'receipt',
    columnWidth: 320,
    onClose: () => {},
    browserContentType: 'adversary',
    browserActiveTab: 'adversaries',
    onTabChange: () => {},
    selectedCustomAdversaryId: null,
    onSelectCustomAdversary: () => {},
    onAddEnvironmentFromBrowser: () => {},
    pcCount: 4,
    updatePartySize: () => {},
    bpAdjustments: {},
    onChangeBpAdjustments: () => {},
    availableBattlePoints: 14,
    spentBattlePoints: 0,
    sortBy: 'name',
    sortDir: 'asc',
    groupBy: 'type',
    onSortBy: () => {},
    onGroupBy: () => {},
    colossusDisplayMode: 'nested',
    onColossusDisplayModeChange: () => {},
    instanceLabelStyle: 'numeric',
    onInstanceLabelStyleChange: () => {},
  }

  // The Encounter List's own +/- controls used to call createAdversary/
  // createAdversariesBulk directly, completely bypassing the same
  // setRecentlyAddedCards wiring the browser-panel add path uses — so the
  // "just added" confirmation pulse never fired when an instance was added
  // this way, even though the round-2 fix looked complete from the browser
  // panel alone (#55 round-3 playtest).
  it('routes its "+" control through onAddAdversaryFromBrowser so the pulse wiring fires, instead of calling createAdversary directly', () => {
    const onAddAdversaryFromBrowser = vi.fn()
    const createAdversary = vi.fn()
    const createAdversariesBulk = vi.fn()
    const adversaryGroups = [
      { id: 'grp1', baseName: 'Bear', type: 'Bruiser', instances: [{ id: 'a1' }] },
    ]

    render(
      <RightColumn
        {...baseProps}
        adversaryGroups={adversaryGroups}
        onAddAdversaryFromBrowser={onAddAdversaryFromBrowser}
        createAdversary={createAdversary}
        createAdversariesBulk={createAdversariesBulk}
        deleteAdversary={() => {}}
      />
    )

    const addButton = screen.getByText('Bear').closest('.receipt-item').querySelectorAll('button')[1]
    fireEvent.click(addButton)

    expect(onAddAdversaryFromBrowser).toHaveBeenCalledTimes(1)
    expect(onAddAdversaryFromBrowser.mock.calls[0][0].name).toBe('Bear')
    expect(createAdversary).not.toHaveBeenCalled()
    expect(createAdversariesBulk).not.toHaveBeenCalled()
  })

  it('falls back to calling createAdversary directly when onAddAdversaryFromBrowser is not provided', () => {
    const createAdversary = vi.fn()
    const adversaryGroups = [
      { id: 'grp1', baseName: 'Bear', type: 'Bruiser', instances: [{ id: 'a1' }] },
    ]

    render(
      <RightColumn
        {...baseProps}
        adversaryGroups={adversaryGroups}
        onAddAdversaryFromBrowser={undefined}
        createAdversary={createAdversary}
        createAdversariesBulk={() => {}}
        deleteAdversary={() => {}}
      />
    )

    const addButton = screen.getByText('Bear').closest('.receipt-item').querySelectorAll('button')[1]
    fireEvent.click(addButton)

    expect(createAdversary).toHaveBeenCalledTimes(1)
  })
})
