import { render, screen, fireEvent } from '@testing-library/react'
import GameCard from './GameCard'

const colossusItem = {
  id: 'grp-1',
  name: 'Ikeri, Injuries Untold',
  isColossus: true,
  tier: 1,
  thresholds: { major: 11, severe: 22 },
  motivesAndTactics: 'Entangle, intimidate, peck, stomp',
  experience: [{ name: 'Huge', modifier: 2 }],
  // colossusStressMax mirrors what EntityColumns.jsx derives for `item` — the
  // framework stress-track length, kept distinct from the `stress` key
  // (reserved for instance HP-tracking fields, zeroed on `item` upstream).
  colossusStressMax: 6,
  features: [{ name: 'Colossal Power', type: 'Passive', description: 'Ikeri deals extra damage.' }],
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
    expect(screen.getByText((_, el) => el?.textContent === 'Head #1')).toBeInTheDocument()
    // Scope to the HP row specifically — the framework Stress row (#109) also renders pips now.
    const hpLabel = screen.getAllByText('HP')[0]
    const hpPips = hpLabel.parentElement.querySelectorAll('[style*="border-radius: 50%"]')
    expect(hpPips.length).toBe(5)
    fireEvent.click(hpPips[0])
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
        segmentInstances={[{ instanceKey: 'ikeri-head', instanceNumber: 1 }]}
        onUpdate={onUpdate}
      />
    )
    expect(screen.getAllByText((_, el) => el?.textContent === 'Head #1').length).toBeGreaterThan(0)
    // The standalone segment card also shows the parent colossus name for context
    expect(screen.getByText('Ikeri, Injuries Untold')).toBeInTheDocument()

    const pips = container.querySelectorAll('[style*="border-radius: 50%"]')
    expect(pips.length).toBeGreaterThan(0)
    fireEvent.click(pips[0])
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { segmentHp: { 'ikeri-head': 1 } })
  })
})

// #97: token tracking ("place a token" / "Broken until cleared" mechanics,
// e.g. Daktadae's Head) — token state keys off the single colossus instance
// id in both display modes, consistent with how segmentHp already works.
describe('GameCard colossus token tracking (#97)', () => {
  const tokenInstance = { id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true, segmentHp: { 'ikeri-head': 0 }, segmentTokens: { 'ikeri-head': 1 } }

  it('nested mode: shows the current token count and increments it on the +1 button, keyed off the colossus instance id', () => {
    const onUpdate = vi.fn()
    render(
      <GameCard
        type="adversary"
        item={colossusItem}
        instances={[tokenInstance]}
        onUpdate={onUpdate}
      />
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Place a token'))
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { segmentTokens: { 'ikeri-head': 2 } })
  })

  it('nested mode: decrements the token count on the -1 button, never below zero', () => {
    const onUpdate = vi.fn()
    render(
      <GameCard
        type="adversary"
        item={colossusItem}
        instances={[tokenInstance]}
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByTitle('Remove a token'))
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { segmentTokens: { 'ikeri-head': 0 } })
  })

  it('nested mode: shows a Broken tag when a segment has tokens, even though its HP is untouched', () => {
    render(
      <GameCard
        type="adversary"
        item={colossusItem}
        instances={[tokenInstance]}
        onUpdate={() => {}}
      />
    )
    expect(screen.getByText('Broken')).toBeInTheDocument()
  })

  it('segments mode: shows and updates the token count on the standalone segment card, keyed off the colossus instance id', () => {
    const onUpdate = vi.fn()
    render(
      <GameCard
        type="adversary"
        item={colossusItem}
        instances={[tokenInstance]}
        segment={colossusItem.segments[0]}
        segmentInstances={[{ instanceKey: 'ikeri-head', instanceNumber: 1 }]}
        onUpdate={onUpdate}
      />
    )
    expect(screen.getAllByText('Broken').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByTitle('Place a token'))
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { segmentTokens: { 'ikeri-head': 2 } })
  })

  it('defaults to zero tokens when segmentTokens is absent from the instance', () => {
    const onUpdate = vi.fn()
    const freshInstance = { id: 'adv-2', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true, segmentHp: { 'ikeri-head': 0 } }
    render(
      <GameCard
        type="adversary"
        item={colossusItem}
        instances={[freshInstance]}
        onUpdate={onUpdate}
      />
    )
    expect(screen.queryByText('Broken')).toBeNull()
    fireEvent.click(screen.getByTitle('Place a token'))
    expect(onUpdate).toHaveBeenCalledWith('adv-2', { segmentTokens: { 'ikeri-head': 1 } })
  })
})

describe('GameCard nested colossus segment cards repeat framework info (#109)', () => {
  it('shows Motives & Tactics, Experience, Thresholds, and Stress on the segment block, in sync with the shared instance stress', () => {
    const onUpdate = vi.fn()
    const instance = { ...colossusInstance, stress: 1 }
    const { container } = render(
      <GameCard type="adversary" item={colossusItem} instances={[instance]} onUpdate={onUpdate} />
    )
    expect(screen.getAllByText(/Entangle, intimidate, peck, stomp/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Huge +2').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Thresh 11\/22/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Colossal Power').length).toBeGreaterThan(0)

    // Two Stress rows now render (top-level colossus header + segment block),
    // both reading/writing the same shared inst.stress field (#109).
    const stressLabels = screen.getAllByText('Stress')
    expect(stressLabels.length).toBe(2)
    const segmentStressPips = stressLabels[1].parentElement.querySelectorAll('[style*="border-radius: 50%"]')
    fireEvent.click(segmentStressPips[3])
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { stress: 4 })
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

describe('GameCard instance label style (#82)', () => {
  const adversaryItem = { id: 'grp-1', name: 'Goblin', hpMax: 10, stressMax: 3, color: 'var(--red)' }
  const instances = [
    { id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, hpMax: 10, stressMax: 3 },
    { id: 'adv-2', duplicateNumber: 2, hp: 0, stress: 0, hpMax: 10, stressMax: 3 },
  ]

  it('defaults to numeric instance badges', () => {
    render(<GameCard type="adversary" item={adversaryItem} instances={instances} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows alphabetic instance badges when instanceLabelStyle is "alphabetic"', () => {
    render(<GameCard type="adversary" item={adversaryItem} instances={instances} instanceLabelStyle="alphabetic" />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.queryByText('1')).toBeNull()
  })
})

describe('GameCard fade-out confirmation pulse on newly-added cards (#55)', () => {
  const adversaryItem = { id: 'grp-1', name: 'Goblin', hpMax: 10, stressMax: 3 }
  const instances = [{ id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, hpMax: 10, stressMax: 3 }]

  it('does not apply the highlight class by default', () => {
    const { container } = render(<GameCard type="adversary" item={adversaryItem} instances={instances} />)
    expect(container.querySelector('.card-recently-added')).toBeNull()
  })

  it('applies the highlight class when isRecentlyAdded is true', () => {
    const { container } = render(<GameCard type="adversary" item={adversaryItem} instances={instances} isRecentlyAdded />)
    expect(container.querySelector('.card-recently-added')).toBeTruthy()
  })
})
