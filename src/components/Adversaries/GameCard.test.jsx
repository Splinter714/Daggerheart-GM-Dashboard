import { render, screen, fireEvent, act } from '@testing-library/react'
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

  it('segments mode (segment prop set): renders this segment as its own standalone card with an interactable HP adjuster (#109)', () => {
    const onUpdate = vi.fn()
    render(
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
    // The parent-colossus context pill was removed (#112) — Jackson confirmed
    // it's redundant with the card header and the group-level header.
    expect(screen.queryByText('Ikeri, Injuries Untold')).not.toBeInTheDocument()

    // HP is rendered as an instance-style +/- adjuster mirroring regular
    // adversary card instance rows (#109), not click-pips.
    const plusButtons = screen.getAllByText('+')
    expect(plusButtons.length).toBeGreaterThan(0)
    fireEvent.click(plusButtons[0])
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

    // Two Stress rows now render (top-level colossus header + segment block),
    // both reading/writing the same shared inst.stress field (#109).
    const stressLabels = screen.getAllByText('Stress')
    expect(stressLabels.length).toBe(2)
    const segmentStressPips = stressLabels[1].parentElement.querySelectorAll('[style*="border-radius: 50%"]')
    fireEvent.click(segmentStressPips[3])
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { stress: 4 })
  })
})

// #118: framework-wide features (e.g. "Colossal Power") must render exactly
// once at the top-level colossus card in Nested display mode — NOT repeated
// on every segment block, unlike the framework info above (Motives/
// Experience/Thresholds/Stress) which is intentionally still repeated.
describe('GameCard nested colossus framework features render once, not per segment (#118)', () => {
  it('nested mode: renders a framework-wide feature (e.g. Colossal Power) exactly once, not per segment', () => {
    const onUpdate = vi.fn()
    render(
      <GameCard type="adversary" item={colossusItem} instances={[colossusInstance]} onUpdate={onUpdate} />
    )
    // Only one segment in this fixture — assert exactly one render even so,
    // guarding against the bug where NestedSegmentBlock re-rendered it per
    // segment on top of the top-level FeatureList render.
    expect(screen.getAllByText('Colossal Power').length).toBe(1)
  })

  it('nested mode: renders a framework-wide feature exactly once even with multiple segments', () => {
    const onUpdate = vi.fn()
    const multiSegmentItem = {
      ...colossusItem,
      segments: [
        { id: 'ikeri-head', name: 'Head', role: 'head', count: 1, hp: 5, difficulty: 16, atk: 2 },
        { id: 'ikeri-tail', name: 'Tail', role: 'tail', count: 1, hp: 4, difficulty: 14, atk: 1 },
      ],
    }
    const multiInstance = { ...colossusInstance, segmentHp: { 'ikeri-head': 0, 'ikeri-tail': 0 } }
    render(
      <GameCard type="adversary" item={multiSegmentItem} instances={[multiInstance]} onUpdate={onUpdate} />
    )
    expect(screen.getAllByText('Colossal Power').length).toBe(1)
  })

  it('segments mode: still repeats the framework-wide feature on the standalone segment card, unchanged (#109 regression guard)', () => {
    const onUpdate = vi.fn()
    render(
      <GameCard
        type="adversary"
        item={colossusItem}
        instances={[colossusInstance]}
        segment={colossusItem.segments[0]}
        segmentInstances={[{ instanceKey: 'ikeri-head', instanceNumber: 1 }]}
        onUpdate={onUpdate}
      />
    )
    expect(screen.getAllByText('Colossal Power').length).toBeGreaterThan(0)
    expect(screen.getByText('Colossus Features')).toBeInTheDocument()
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

  // Playtested 2026-07-04: Jackson found the PASSIVES/ACTIONS/REACTIONS
  // section-header formatting inconsistent between environment and
  // adversary cards. The header text color must match the adversary card's
  // FeatureDivider (text-primary, not text-secondary).
  it('formats section headers (e.g. PASSIVES) identically to adversary cards — text-primary color, uppercase h4', () => {
    const envItem = {
      id: 'env-1', name: 'Ashen Wastes', type: 'Exploration', tier: 2,
      features: [{ name: 'Choking Ash', type: 'Passive', description: 'The air is thick with ash.' }],
    }
    render(<GameCard type="environment" item={envItem} />)
    const header = screen.getByText('Passives')
    expect(header.tagName).toBe('H4')
    expect(header.style.color).toBe('var(--text-primary)')
    expect(header.style.textTransform).toBe('uppercase')
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

// #50: vertical scroll-to-reveal for a newly added instance was silently
// disabled by a stray `return // scroll disabled` early-return left in the
// effect (from an old, unrelated UI pass) — the rest of the logic (finding
// the newest alive instance, computing the scroll delta) was still present
// and correct, it just never ran. This asserts the effect actually calls
// scrollBy when a new instance is added and out of view, so a future
// regression that reintroduces a silent early-return gets caught.
describe('GameCard vertical scroll-to-reveal on new instance (#50)', () => {
  const adversaryItem = { id: 'grp-1', name: 'Goblin', hpMax: 10, stressMax: 3 }

  it('scrolls the instance list to reveal a newly added instance that is below the fold', async () => {
    const oneInstance = [{ id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, hpMax: 10, stressMax: 3 }]
    const twoInstances = [
      ...oneInstance,
      { id: 'adv-2', duplicateNumber: 2, hp: 0, stress: 0, hpMax: 10, stressMax: 3 },
    ]

    const { container, rerender } = render(
      <GameCard type="adversary" item={adversaryItem} instances={oneInstance} />
    )

    const scrollable = container.querySelector('.invisible-scrollbar')
    const scrollBySpy = vi.fn()
    scrollable.scrollBy = scrollBySpy
    // Simulate the new instance rendering below the visible viewport.
    scrollable.getBoundingClientRect = () => ({ top: 0, bottom: 400 })

    rerender(<GameCard type="adversary" item={adversaryItem} instances={twoInstances} />)

    const newEl = container.querySelector('[data-instance-id="adv-2"]')
    expect(newEl).toBeTruthy()
    newEl.getBoundingClientRect = () => ({ top: 450, bottom: 500 })

    await new Promise(resolve => requestAnimationFrame(resolve))
    await new Promise(resolve => requestAnimationFrame(resolve))

    expect(scrollBySpy).toHaveBeenCalled()
    const call = scrollBySpy.mock.calls[0][0]
    expect(call.top).toBeGreaterThan(0)
  })
})

describe('GameCard quick-edit pencil placement (#30)', () => {
  const adversaryItem = { id: 'grp-1', name: 'Goblin', hpMax: 10, stressMax: 3 }
  const instances = [{ id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, hpMax: 10, stressMax: 3 }]

  it('renders the Edit toggle inline with the name/count row, not as a free-floating absolute overlay', () => {
    const { container } = render(
      <GameCard type="adversary" item={adversaryItem} instances={instances} onAddInstance={vi.fn()} onRemoveInstance={vi.fn()} />
    )
    const editBtn = screen.getByTitle('Edit')
    // The old placement pinned the button with `position: absolute`; the
    // fixed version sits in normal flex flow next to the title instead.
    expect(editBtn.closest('[style*="position: absolute"]')).toBeNull()
  })
})

describe('GameCard quick-edit: minus is the only removal control, at every instance count (#30)', () => {
  const adversaryItem = { id: 'grp-1', name: 'Goblin', hpMax: 10, stressMax: 3 }
  const oneInstance = [{ id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, hpMax: 10, stressMax: 3 }]
  const twoInstances = [
    ...oneInstance,
    { id: 'adv-2', duplicateNumber: 2, hp: 0, stress: 0, hpMax: 10, stressMax: 3 },
  ]

  // Round-3 playtest feedback (#30): the fully separate delete/X button must
  // be absent always, not just at 1 instance — the minus button is the only
  // removal control at every count.
  //
  // Round-4 playtest feedback (#30): at exactly 1 instance, removing takes the
  // whole card/group with it, so that destructive action needs the same
  // two-stage confirm safety net used elsewhere (deleteConfirm pattern) —
  // first click arms it, second click actually calls onRemoveInstance. At 2+
  // instances, minus still decrements immediately with no confirmation step.
  it('at 1 instance: shows only the minus button, no separate delete button, and minus requires a two-stage confirm before calling onRemoveInstance', () => {
    const onRemoveInstance = vi.fn()
    const onDelete = vi.fn()
    render(
      <GameCard
        type="adversary" item={adversaryItem} instances={oneInstance}
        onAddInstance={vi.fn()} onRemoveInstance={onRemoveInstance} onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByTitle('Edit'))

    expect(screen.queryByTitle('Remove all')).toBeNull()
    expect(screen.getByTitle('Remove one')).toBeInTheDocument()

    // First click arms the confirm state — no removal yet.
    fireEvent.click(screen.getByTitle('Remove one'))
    expect(onRemoveInstance).not.toHaveBeenCalled()
    expect(screen.getByTitle('Click again to confirm')).toBeInTheDocument()
    expect(screen.queryByTitle('Remove one')).toBeNull()

    // Second click actually removes.
    fireEvent.click(screen.getByTitle('Click again to confirm'))
    expect(onRemoveInstance).toHaveBeenCalledTimes(1)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('at 1 instance: the armed confirm state resets automatically after 3 seconds', () => {
    vi.useFakeTimers()
    const onRemoveInstance = vi.fn()
    render(
      <GameCard
        type="adversary" item={adversaryItem} instances={oneInstance}
        onAddInstance={vi.fn()} onRemoveInstance={onRemoveInstance} onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('Edit'))
    fireEvent.click(screen.getByTitle('Remove one'))
    expect(screen.getByTitle('Click again to confirm')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(3000) })

    expect(screen.getByTitle('Remove one')).toBeInTheDocument()
    expect(screen.queryByTitle('Click again to confirm')).toBeNull()
    expect(onRemoveInstance).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('at 2+ instances: shows only the minus button, still no separate delete-all button, and decrements immediately with no confirm step', () => {
    const onRemoveInstance = vi.fn()
    render(
      <GameCard
        type="adversary" item={adversaryItem} instances={twoInstances}
        onAddInstance={vi.fn()} onRemoveInstance={onRemoveInstance} onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('Edit'))

    expect(screen.getByTitle('Remove one')).toBeInTheDocument()
    expect(screen.queryByTitle('Remove all')).toBeNull()
    expect(screen.queryByTitle('Remove')).toBeNull()

    fireEvent.click(screen.getByTitle('Remove one'))
    expect(onRemoveInstance).toHaveBeenCalledTimes(1)
    expect(screen.queryByTitle('Click again to confirm')).toBeNull()
  })

  it('adversary card without onAddInstance/onRemoveInstance at all (e.g. a colossus) falls back to the standalone delete button', () => {
    const onDelete = vi.fn()
    render(
      <GameCard
        type="adversary" item={adversaryItem} instances={oneInstance}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByTitle('Edit'))
    expect(screen.getByTitle('Remove all')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Remove all'))
    fireEvent.click(screen.getByTitle('Click again to confirm'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

// #30 playtest 2026-07-05: Minions add/remove in groups of pcCount per click
// (1 Battle Point == 1 group of party-size minions, mirroring EntityColumns.jsx's
// isMinion ? pcCount : 1 logic, which already calls onAddInstance/onRemoveInstance
// once per click regardless of type). The quick-edit stepper's displayed count and
// its "last one left" delete-confirm threshold must speak in groups for Minions
// (raw instances.length is the wrong unit — a 2-group, 8-minion card should read
// "2" and only arm the confirm once decremented to the last group of 4, not the
// last individual minion).
describe('GameCard quick-edit: Minion stepper counts and confirms in party-size groups (#30)', () => {
  const minionItem = { id: 'grp-1', name: 'Sniper', type: 'Minion', hpMax: 1, stressMax: 1 }
  const makeInstances = (n) =>
    Array.from({ length: n }, (_, i) => ({ id: `adv-${i + 1}`, duplicateNumber: i + 1, hp: 0, stress: 0, hpMax: 1, stressMax: 1 }))

  it('displays the group count (instances / pcCount), not the raw minion count', () => {
    render(
      <GameCard
        type="adversary" item={minionItem} instances={makeInstances(8)} pcCount={4}
        onAddInstance={vi.fn()} onRemoveInstance={vi.fn()} onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('Edit'))
    // 8 minions at pcCount=4 is 2 groups (2 Battle Points), not "8". The stepper's
    // count sits between the minus and plus buttons in the quick-edit row.
    const stepperCount = screen.getByTitle('Remove one').nextSibling
    expect(stepperCount).toHaveTextContent('2')
  })

  it('at 2+ groups (e.g. 8 minions, pcCount 4): minus decrements one call, no confirm step', () => {
    const onRemoveInstance = vi.fn()
    render(
      <GameCard
        type="adversary" item={minionItem} instances={makeInstances(8)} pcCount={4}
        onAddInstance={vi.fn()} onRemoveInstance={onRemoveInstance} onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('Edit'))
    fireEvent.click(screen.getByTitle('Remove one'))
    expect(onRemoveInstance).toHaveBeenCalledTimes(1)
    expect(screen.queryByTitle('Click again to confirm')).toBeNull()
  })

  it('at exactly 1 group left (e.g. 4 minions, pcCount 4): minus requires the two-stage confirm, matching the last-instance behavior for non-Minions', () => {
    const onRemoveInstance = vi.fn()
    render(
      <GameCard
        type="adversary" item={minionItem} instances={makeInstances(4)} pcCount={4}
        onAddInstance={vi.fn()} onRemoveInstance={onRemoveInstance} onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('Edit'))

    // First click arms — no removal yet, even though 4 raw instances remain.
    fireEvent.click(screen.getByTitle('Remove one'))
    expect(onRemoveInstance).not.toHaveBeenCalled()
    expect(screen.getByTitle('Click again to confirm')).toBeInTheDocument()

    // Second click removes the whole last group in one onRemoveInstance call.
    fireEvent.click(screen.getByTitle('Click again to confirm'))
    expect(onRemoveInstance).toHaveBeenCalledTimes(1)
  })

  it('non-Minion adversaries are unaffected by pcCount — group size stays 1', () => {
    const onRemoveInstance = vi.fn()
    render(
      <GameCard
        type="adversary" item={{ id: 'grp-2', name: 'Goblin', hpMax: 10, stressMax: 3 }}
        instances={makeInstances(4)} pcCount={4}
        onAddInstance={vi.fn()} onRemoveInstance={onRemoveInstance} onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('Edit'))
    // 4 individual (non-Minion) instances still display as "4", not collapsed into 1 group.
    const stepperCount = screen.getByTitle('Remove one').nextSibling
    expect(stepperCount).toHaveTextContent('4')
    fireEvent.click(screen.getByTitle('Remove one'))
    expect(onRemoveInstance).toHaveBeenCalledTimes(1)
    expect(screen.queryByTitle('Click again to confirm')).toBeNull()
  })
})
