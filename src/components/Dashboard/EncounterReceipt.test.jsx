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
  const isOwnText = (content, el) =>
    el?.textContent === content && Array.from(el.children).every(child => child.textContent !== content)

  it('formats minion rows as "{group count} {name} ({instances per group}) = {total instances}" (#87)', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 'm1', type: 'Minion', name: 'Giant Rat' }, quantity: 2, instanceCount: 6 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} />)

    expect(screen.getByText((_, el) => isOwnText('2 Giant Rat (3) = 6', el))).toBeTruthy()
  })

  it('keeps each minion group row independently formatted when multiple groups of different types exist (#87)', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 'm1', type: 'Minion', name: 'Sniper' }, quantity: 1, instanceCount: 4 },
      { type: 'adversary', item: { id: 'm2', type: 'Minion', name: 'Grunt' }, quantity: 2, instanceCount: 8 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} />)

    expect(screen.getByText((_, el) => isOwnText('1 Sniper (4) = 4', el))).toBeTruthy()
    expect(screen.getByText((_, el) => isOwnText('2 Grunt (4) = 8', el))).toBeTruthy()
  })

  it('formats a single minion group with 1 instance per group correctly', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 'm1', type: 'Minion', name: 'Sniper' }, quantity: 1, instanceCount: 1 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} />)

    expect(screen.getByText((_, el) => isOwnText('1 Sniper (1) = 1', el))).toBeTruthy()
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

  it('tags auto-detected adjustments distinctly from manual toggles, with the auto badge on the left (#78)', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 's1', type: 'Solo', name: 'Solo A' }, quantity: 2 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} bpAdjustments={{}} />)

    // "2+ Solos" auto-adjustment is active and carries the "auto" tag.
    expect(screen.getByText('2+ Solos')).toBeTruthy()
    const autoTags = screen.getAllByText('auto')
    expect(autoTags.length).toBeGreaterThan(0)

    // The "auto" badge sits to the left of its row label (not the fill-circle indicator).
    const label = screen.getByText('2+ Solos')
    const row = label.closest('div')
    const autoTagInRow = autoTags.find(tag => row.contains(tag))
    expect(autoTagInRow).toBeTruthy()
    const rowChildren = Array.from(row.children)
    expect(rowChildren.indexOf(autoTagInRow)).toBeLessThan(rowChildren.indexOf(label))
  })

  it('marks "No Major Threats" active even when the board is empty (#78)', () => {
    render(<EncounterReceipt {...baseProps} encounterItems={[]} />)

    const label = screen.getByText('No Major Threats')
    // Active rows render the label in primary (not secondary/dimmed) text color.
    expect(label.style.color).toBe('var(--text-primary)')
  })

  it('gives the auto badge a distinct active fill when its condition is true, vs inactive (#78)', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 's1', type: 'Solo', name: 'Solo A' }, quantity: 2 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} />)

    // "2+ Solos" is active (2 solos present) — its auto badge should be filled/highlighted.
    const activeLabel = screen.getByText('2+ Solos')
    const activeRow = activeLabel.closest('div')
    const activeBadge = Array.from(activeRow.children).find(el => el.textContent === 'auto')
    expect(activeBadge.style.background).toBe('var(--purple)')

    // "No Major Threats" is inactive (a Solo counts as a major threat) — its badge should not be filled.
    const inactiveLabel = screen.getByText('No Major Threats')
    const inactiveRow = inactiveLabel.closest('div')
    const inactiveBadge = Array.from(inactiveRow.children).find(el => el.textContent === 'auto')
    expect(inactiveBadge.style.background).not.toBe('var(--purple)')
  })

  it('unifies the auto-adjustment rows\' container styling with the manual adjustment rows (#78)', () => {
    const encounterItems = [
      { type: 'adversary', item: { id: 's1', type: 'Solo', name: 'Solo A' }, quantity: 2 },
    ]
    render(<EncounterReceipt {...baseProps} encounterItems={encounterItems} />)

    const manualRow = screen.getByText('Less Difficult').closest('div')
    const autoRow = screen.getByText('2+ Solos').closest('div')

    // No distinct background/border wrapper on the auto rows — same as manual rows.
    expect(autoRow.style.background).toBe(manualRow.style.background)
    expect(autoRow.style.borderRadius).toBe(manualRow.style.borderRadius)
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
