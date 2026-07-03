import { render, screen, fireEvent } from '@testing-library/react'
import GameCard from './GameCard'

const colossusItem = {
  id: 'grp-1',
  name: 'Ikeri, Injuries Untold',
  isColossus: true,
  tier: 1,
  thresholds: { major: 11, severe: 22 },
  segments: [
    { id: 'ikeri-head', name: 'Head', role: 'head', count: 1, hp: 5, difficulty: 16, atk: 2 },
  ],
}

const colossusInstance = { id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true, segmentHp: { 'ikeri-head': 0 } }

describe('GameCard colossus display modes', () => {
  it('nested mode (no segment prop): renders segments list inside one card with interactable HP pips', () => {
    const onUpdate = vi.fn()
    const { container } = render(
      <GameCard
        type="adversary"
        item={colossusItem}
        instances={[colossusInstance]}
        onUpdate={onUpdate}
      />
    )
    expect(screen.getByText('Head')).toBeInTheDocument()
    const pips = container.querySelectorAll('[style*="border-radius: 50%"]')
    expect(pips.length).toBeGreaterThan(0)
    fireEvent.click(pips[0])
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { segmentHp: { 'ikeri-head': 1 } })
  })

  it('segments mode (segment prop set): renders this segment as its own standalone card with interactable HP pips', () => {
    const onUpdate = vi.fn()
    const { container } = render(
      <GameCard
        type="adversary"
        item={colossusItem}
        instances={[colossusInstance]}
        segment={colossusItem.segments[0]}
        segmentKey="ikeri-head"
        onUpdate={onUpdate}
      />
    )
    expect(screen.getByText('Head')).toBeInTheDocument()
    // The standalone segment card also shows the parent colossus name for context
    expect(screen.getByText('Ikeri, Injuries Untold')).toBeInTheDocument()

    const pips = container.querySelectorAll('[style*="border-radius: 50%"]')
    expect(pips.length).toBeGreaterThan(0)
    fireEvent.click(pips[0])
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { segmentHp: { 'ikeri-head': 1 } })
  })
})
