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

describe('GameCard environment difficulty prominence (#104)', () => {
  const envItem = { id: 'env-1', name: 'Ashen Wastes', type: 'Exploration', tier: 2, difficulty: 15 }

  it('renders difficulty as a prominent hex stat badge, matching adversary card conventions', () => {
    render(<GameCard type="environment" item={envItem} />)
    // MergedStatBadge renders label/value as SVG <text> nodes
    expect(screen.getByText('DIFF')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('still shows type and tier in the metadata pill alongside the badge', () => {
    render(<GameCard type="environment" item={envItem} />)
    expect(screen.getByText('Exploration')).toBeInTheDocument()
    expect(screen.getByText('· T2')).toBeInTheDocument()
  })

  it('omits the difficulty badge when the environment has no difficulty', () => {
    render(<GameCard type="environment" item={{ ...envItem, difficulty: null }} />)
    expect(screen.queryByText('DIFF')).toBeNull()
  })
})

describe('GameCard environment potential-adversaries list styling (#103)', () => {
  const envItem = {
    id: 'env-1', name: 'Ashen Wastes', type: 'Exploration', tier: 2,
    potentialAdversaries: ['Bone Golem', 'Ash Wraith'],
  }

  it('renders each potential adversary as a distinct styled tag', () => {
    const { container } = render(<GameCard type="environment" item={envItem} />)
    expect(screen.getByText('Bone Golem')).toBeInTheDocument()
    expect(screen.getByText('Ash Wraith')).toBeInTheDocument()
    const tag = screen.getByText('Bone Golem')
    expect(tag.tagName).toBe('SPAN')
    expect(container.querySelector('[style*="border-radius: 0.25rem"]')).toBeTruthy()
  })

  it('omits the section entirely when there are no potential adversaries', () => {
    render(<GameCard type="environment" item={{ ...envItem, potentialAdversaries: [] }} />)
    expect(screen.queryByText('Potential Adversaries')).toBeNull()
  })
})

describe('GameCard environment visual polish pass (#100)', () => {
  it('renders impulses as a bordered quote-block, matching the adversary motives convention', () => {
    const envItem = { id: 'env-1', name: 'Ashen Wastes', type: 'Exploration', tier: 2, impulses: 'Smother, consume, spread.' }
    render(<GameCard type="environment" item={envItem} />)
    expect(screen.getByText('Smother, consume, spread.')).toBeInTheDocument()
  })

  it('omits the impulses block when absent', () => {
    const envItem = { id: 'env-1', name: 'Ashen Wastes', type: 'Exploration', tier: 2 }
    render(<GameCard type="environment" item={envItem} />)
    expect(screen.queryByText(/Smother/)).toBeNull()
  })
})

describe('GameCard environment narrow/mobile layout (#105)', () => {
  it('wraps the difficulty badge + type/tier row instead of forcing overflow at narrow widths', () => {
    const envItem = { id: 'env-1', name: 'Ashen Wastes', type: 'Exploration', tier: 2, difficulty: 15 }
    const { container } = render(<GameCard type="environment" item={envItem} />)
    const row = container.querySelector('[style*="flex-wrap: wrap"]')
    expect(row).toBeTruthy()
  })

  it('truncates a long environment name instead of overflowing the header', () => {
    const longName = 'The Impossibly Long Environment Name That Would Overflow A Narrow Card'
    render(<GameCard type="environment" item={{ id: 'env-1', name: longName, type: 'Exploration', tier: 2 }} />)
    const heading = screen.getByText(longName)
    expect(heading.style.whiteSpace).toBe('nowrap')
    expect(heading.style.textOverflow).toBe('ellipsis')
  })
})
