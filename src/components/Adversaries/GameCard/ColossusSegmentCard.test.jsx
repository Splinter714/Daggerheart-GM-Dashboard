import { render, screen, fireEvent } from '@testing-library/react'
import ColossusSegmentCard from './ColossusSegmentCard'

const colossus = {
  name: 'Ikeri, Injuries Untold',
  tier: 1,
  thresholds: { major: 11, severe: 22 },
  motivesAndTactics: 'Entangle, intimidate, peck, stomp',
  experience: [{ name: 'Huge', modifier: 2 }],
  // colossusStressMax mirrors what EntityColumns.jsx derives from the raw
  // colossus `stress` field (the framework stress-track length) — the plain
  // `stress` key on `item`/`colossus` is reserved for instance HP-tracking
  // fields elsewhere and gets zeroed before reaching GameCard.
  colossusStressMax: 6,
  features: [{ name: 'Colossal Power', type: 'Passive', description: 'Ikeri deals extra damage.' }],
}
const segment = {
  id: 'ikeri-head',
  name: 'Head',
  hp: 5,
  difficulty: 16,
  atk: 2,
  weapon: 'Peck',
  range: 'Melee',
  damage: '1d10+1 phy',
  features: [{ name: 'Fatal', type: 'Passive', description: 'When the Head is Destroyed, Ikeri is defeated.' }],
}
const inst = { id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 2, isVisible: true }

const makeSlot = (overrides = {}) => ({
  instanceKey: 'ikeri-head',
  instanceNumber: 1,
  markedHp: 0,
  onToggleHpPip: vi.fn(),
  tokenCount: 0,
  onTokenChange: vi.fn(),
  ...overrides,
})

const baseProps = {
  colossus,
  segment,
  slots: [makeSlot()],
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  inst,
  getCardStyle: () => ({ backgroundColor: 'var(--bg-card)' }),
  quickEdit: false,
  setQuickEdit: vi.fn(),
}

describe('ColossusSegmentCard', () => {
  it('renders segment name, difficulty, ATK, and weapon using regular adversary card conventions', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getAllByText((_, el) => el?.textContent === 'Head').length).toBeGreaterThan(0)
    expect(screen.getByText('16')).toBeInTheDocument() // difficulty badge value
    expect(screen.getByText('+2')).toBeInTheDocument() // ATK badge value
    expect(screen.getByText('Peck')).toBeInTheDocument()
  })

  // #112: Jackson confirmed after #108's fix landed that the parent-colossus
  // context pill isn't needed at all — remove it entirely.
  it('does not render a parent-colossus context pill (#112)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.queryByText('Ikeri, Injuries Untold')).not.toBeInTheDocument()
    expect(screen.queryByText((_, el) => el?.textContent === 'T1 Colossus')).not.toBeInTheDocument()
  })

  // #109: exact row order from the 2026-07-04 playtest spec — row 1 =
  // Attack + Standard Attack, row 2 = Difficulty + Thresholds, row 3 =
  // Motives + Experience, then the instance mini-cards.
  it('renders rows in the playtest-specified order: ATK+weapon, then Difficulty+Thresholds, then Motives+Experience', () => {
    const { container } = render(<ColossusSegmentCard {...baseProps} />)
    const atkBadgeValue = screen.getByText('+2')
    const diffBadgeValue = screen.getByText('16')
    const motives = screen.getByText(/Entangle, intimidate, peck, stomp/)
    const experience = screen.getByText('Huge +2')

    const position = (el) => {
      const all = Array.from(container.querySelectorAll('*'))
      return all.indexOf(el)
    }
    expect(position(atkBadgeValue)).toBeLessThan(position(diffBadgeValue))
    expect(position(diffBadgeValue)).toBeLessThan(position(motives))
    expect(position(motives)).toBeLessThan(position(experience))
  })

  // #97: Jackson's playtest feedback was "what even are these tokens? I
  // don't get it" — the Tokens label now carries a hover tooltip explaining
  // the Broken-until-cleared mechanic.
  it('explains what the Tokens counter tracks via a hover tooltip (#97)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    const tokensLabel = screen.getByText('Tokens')
    expect(tokensLabel).toHaveAttribute('title', expect.stringContaining('Broken until all tokens are cleared'))
  })

  it('renders an HP adjuster (+/- buttons) for each instance mini-card, calling onToggleHpPip with the new marked count', () => {
    const onToggleHpPip = vi.fn()
    render(<ColossusSegmentCard {...baseProps} slots={[makeSlot({ markedHp: 2, onToggleHpPip })]} />)
    const plusButtons = screen.getAllByText('+')
    fireEvent.click(plusButtons[0])
    expect(onToggleHpPip).toHaveBeenCalledWith(2)
  })

  it('renders a Stress adjuster (+/- buttons) for each instance mini-card, calling onUpdate with the shared instance stress field', () => {
    const onUpdate = vi.fn()
    render(<ColossusSegmentCard {...baseProps} onUpdate={onUpdate} />)
    const plusButtons = screen.getAllByText('+')
    // Second "+" button belongs to the Stress StatCounter (HP is first)
    fireEvent.click(plusButtons[1])
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { stress: 3 })
  })

  it('shows Destroyed label when all HP is marked', () => {
    render(<ColossusSegmentCard {...baseProps} slots={[makeSlot({ markedHp: 5 })]} />)
    expect(screen.getAllByText('Destroyed').length).toBeGreaterThan(0)
  })

  it('shows Broken label at half HP marked', () => {
    render(<ColossusSegmentCard {...baseProps} slots={[makeSlot({ markedHp: 3 })]} />)
    expect(screen.getAllByText('Broken').length).toBeGreaterThan(0)
  })

  it('shows the running instance number for each instance slot (#109, #110)', () => {
    render(<ColossusSegmentCard {...baseProps} slots={[
      makeSlot({ instanceKey: 'ikeri-head-1', instanceNumber: 3 }),
      makeSlot({ instanceKey: 'ikeri-head-2', instanceNumber: 4 }),
    ]} />)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
    expect(screen.getAllByText((_, el) => el?.textContent === 'Head #3').length).toBeGreaterThan(0)
    expect(screen.getAllByText((_, el) => el?.textContent === 'Head #4').length).toBeGreaterThan(0)
  })

  it('consolidates multiple instances into one card with independent HP adjusters per slot (#110)', () => {
    const onToggleHpPipA = vi.fn()
    const onToggleHpPipB = vi.fn()
    render(<ColossusSegmentCard {...baseProps} slots={[
      makeSlot({ instanceKey: 'ikeri-head-1', instanceNumber: 3, markedHp: 1, onToggleHpPip: onToggleHpPipA }),
      makeSlot({ instanceKey: 'ikeri-head-2', instanceNumber: 4, markedHp: 2, onToggleHpPip: onToggleHpPipB }),
    ]} />)
    // Two mini-cards each with their own HP StatCounter + shared Stress
    // StatCounter = 4 "+" buttons total (2 per mini-card).
    const plusButtons = screen.getAllByText('+')
    expect(plusButtons.length).toBe(4)
    // First mini-card's HP "+" only calls that slot's handler
    fireEvent.click(plusButtons[0])
    expect(onToggleHpPipA).toHaveBeenCalledWith(1)
    expect(onToggleHpPipB).not.toHaveBeenCalled()
  })

  it('shows framework-shared Motives & Tactics (#109)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText(/Entangle, intimidate, peck, stomp/)).toBeInTheDocument()
  })

  it('shows framework-shared Experience (#109)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText('Huge +2')).toBeInTheDocument()
  })

  it('shows framework-shared Thresholds (#109)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText('Major 11 / Severe 22')).toBeInTheDocument()
  })

  it('shows both segment-specific and framework-wide features, clearly distinguished (#109)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText('Fatal')).toBeInTheDocument()
    expect(screen.getByText('Colossal Power')).toBeInTheDocument()
    expect(screen.getByText('Colossus Features')).toBeInTheDocument()
  })

  // #79: the DIFF/thresholds badges are fixed-size and must not shrink —
  // only the weapon pill should give way, wrapping onto its own line at
  // narrow widths instead of being squeezed illegibly small. Verifies the
  // structural styles (flexShrink/flexBasis) rather than pixel layout, since
  // jsdom doesn't compute real flex-wrap — the live 375px-viewport check in
  // this session confirmed the visual wrap.
  it('does not let the thresholds badge or weapon pill shrink to fit — thresholds is flex-shrink 0 and the weapon pill has a wrap-forcing flex-basis (#79)', () => {
    const { container } = render(<ColossusSegmentCard {...baseProps} />)

    const thresholdsText = screen.getByText('Major 11 / Severe 22')
    const thresholdsWrapper = thresholdsText.parentElement
    expect(thresholdsWrapper.style.flexShrink).toBe('0')

    const weaponPill = container.querySelector('[style*="flex: 1 1 160px"]')
    expect(weaponPill).toBeTruthy()
    expect(weaponPill.textContent).toContain('Peck')
  })
})
