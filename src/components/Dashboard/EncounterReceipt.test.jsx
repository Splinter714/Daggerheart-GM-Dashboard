import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EncounterReceipt from './EncounterReceipt'

const baseProps = {
  pcCount: 4,
  onChangePcCount: vi.fn(),
  onAdd: vi.fn(),
  onRemove: vi.fn(),
  onChangeBpAdjustments: vi.fn(),
  availableBattlePoints: 14,
  spentBattlePoints: 0,
  onSortBy: vi.fn(),
}

describe('EncounterReceipt', () => {
  it('shows the total minion instance count alongside the BP-group quantity (#87)', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 'm1', type: 'Minion', name: 'Sniper' }, quantity: 1, instanceCount: 4 },
      { type: 'adversary', item: { id: 'm2', type: 'Minion', name: 'Grunt' }, quantity: 2, instanceCount: 8 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} />)

    expect(screen.getByText((_, el) => el?.textContent === '· 12 instances')).toBeTruthy()
  })

  it('singularizes the instance count label when exactly one instance', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 'm1', type: 'Minion', name: 'Sniper' }, quantity: 1, instanceCount: 1 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} />)

    expect(screen.getByText((_, el) => el?.textContent === '· 1 instance')).toBeTruthy()
  })

  it('renders colossi as separate rows, marks them not BP-costed, and hides the stepper controls (#99)', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 'c1', type: 'Colossus', name: 'Ikeri, Injuries Untold' }, quantity: 1 },
      { type: 'adversary', item: { id: 'c2', type: 'Colossus', name: 'Ikeri, Injuries Untold' }, quantity: 1 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} />)

    expect(screen.getByText('(not BP-costed)')).toBeTruthy()
    expect(screen.getAllByText('Ikeri, Injuries Untold')).toHaveLength(2)
  })
})
