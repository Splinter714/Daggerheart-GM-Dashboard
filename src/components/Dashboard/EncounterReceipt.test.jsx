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

  it('tags auto-detected adjustments distinctly from manual toggles (#78)', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 's1', type: 'Solo', name: 'Solo A' }, quantity: 2 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} bpAdjustments={{}} />)

    // "2+ Solos" auto-adjustment is active and carries the "auto" tag.
    expect(screen.getByText('2+ Solos')).toBeTruthy()
    expect(screen.getAllByText('auto').length).toBeGreaterThan(0)
  })

  it('makes Remaining the dominant footer figure, with Budget and Used as smaller supporting lines (#78)', () => {
    const encounterItems = []
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} availableBattlePoints={14} spentBattlePoints={6} />)

    const remainingLabel = screen.getByText('Remaining')
    const budgetLabel = screen.getByText('Budget')
    const usedLabel = screen.getByText('Used')

    expect(parseFloat(remainingLabel.style.fontSize)).toBeGreaterThan(parseFloat(budgetLabel.style.fontSize))
    expect(parseFloat(remainingLabel.style.fontSize)).toBeGreaterThan(parseFloat(usedLabel.style.fontSize))
    expect(screen.getByText('8 BP')).toBeTruthy() // remaining
    expect(screen.getByText('6 BP')).toBeTruthy() // used
    expect(screen.getAllByText('14 BP').length).toBeGreaterThan(0) // budget (and base party BP, same value)
  })
})
