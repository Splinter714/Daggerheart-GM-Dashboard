import { render, screen, fireEvent } from '@testing-library/react'
import ColossusSegmentCard, { NestedSegmentBlock } from './ColossusSegmentCard'

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

  // #109 round 2: thresholds now render via the shared ThresholdPill
  // component (same Minor/Major/Severe pill the regular adversary card
  // uses) instead of a bespoke "Major X / Severe Y" plain-text badge.
  it('shows framework-shared Thresholds using the shared adversary-card threshold pill (#109)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText('Major')).toBeInTheDocument()
    expect(screen.getByText('Severe')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('22')).toBeInTheDocument()
  })

  // #119: in Segments display mode, framework-wide features (e.g. "Colossal
  // Power") are merged into the same type-grouped Passives/Actions/Reactions
  // sections as segment-specific features — no separate "Colossus Features"
  // block, and no tag/badge distinguishing the two once merged.
  it('merges segment-specific and framework-wide features into the same type-grouped sections, with no separate Colossus Features block (#119)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText('Fatal')).toBeInTheDocument()
    expect(screen.getByText('Colossal Power')).toBeInTheDocument()
    expect(screen.queryByText('Colossus Features')).not.toBeInTheDocument()
    // Both features are type "Passive" — they should appear together under
    // a single "Passives" section header (not one each under two headers).
    expect(screen.getAllByText('Passives').length).toBe(1)
  })

  // #119 regression guard: this change is scoped to Segments mode only.
  // Nested display mode's segment block (#118) renders framework-wide
  // features once at the top-level colossus card (see GameCard.test.jsx's
  // #118 coverage) rather than per segment block at all — it must not gain
  // a merged or separate framework-features section of its own.
  it('Nested mode segment block only renders segment-specific features, not framework-wide ones (#119 regression guard)', () => {
    render(
      <NestedSegmentBlock
        seg={segment}
        instanceKey="ikeri-head"
        instanceNumber={1}
        markedHp={0}
        tokenCount={0}
        inst={inst}
        colossus={colossus}
        onUpdate={vi.fn()}
      />
    )
    expect(screen.getByText('Fatal')).toBeInTheDocument()
    expect(screen.queryByText('Colossal Power')).not.toBeInTheDocument()
    expect(screen.queryByText('Colossus Features')).not.toBeInTheDocument()
  })

  // #79: the weapon pill (row 1) must not be squeezed illegibly small at
  // narrow widths — it has a wrap-forcing flex-basis so it gives way onto
  // its own line instead. Verifies the structural style rather than pixel
  // layout, since jsdom doesn't compute real flex-wrap — the live
  // 375px-viewport check in this session confirmed the visual wrap.
  it('gives the weapon pill a wrap-forcing flex-basis so it does not shrink to fit (#79)', () => {
    const { container } = render(<ColossusSegmentCard {...baseProps} />)

    const weaponPill = container.querySelector('[style*="flex: 1 1 160px"]')
    expect(weaponPill).toBeTruthy()
    expect(weaponPill.textContent).toContain('Peck')
  })

  // #109 round 2: the thresholds pill (row 2) must render via the exact same
  // shared ThresholdPill component/styling the regular adversary card uses
  // (flex: 1, stretching to fill the row) rather than the earlier
  // flex-shrink:0/shrink-to-content variant, which visually diverged in
  // width and alignment from the adversary card's threshold pill.
  it('renders the thresholds pill with the same flex:1 stretch behavior as the regular adversary card (#109)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    const thresholdsLabel = screen.getByText('Major', { selector: 'span' })
    const thresholdsPill = thresholdsLabel.parentElement
    expect(thresholdsPill.getAttribute('style')).toContain('flex: 1 1 0%')
  })

  // #109 round 3: when a segment has no attack, the empty ATK/weapon row
  // wrapper must not render at all — otherwise its own paddingTop stacks
  // with the DIFF/Thresholds row's paddingTop, doubling the visual gap
  // above DIFF/Thresholds compared to when an attack row IS present.
  it('does not render the ATK/weapon row wrapper when the segment has no attack (#109)', () => {
    const noAttackSegment = { ...segment, atk: null, weapon: null, range: null, damage: null }
    const { container } = render(<ColossusSegmentCard {...baseProps} segment={noAttackSegment} />)
    // The DIFF badge should be the first paddingTop-bearing row in the body.
    const diffBadge = screen.getByText('16')
    const rowWithPaddingTop = diffBadge.closest('[style*="padding-top"]')
    expect(rowWithPaddingTop).toBeTruthy()
    // No sibling row above it should also carry the CARD_SPACE_V paddingTop
    // meant for the ATK row — i.e. DIFF's row is the first such element.
    const allPaddedRows = Array.from(container.querySelectorAll('[style*="padding-top"]'))
    expect(allPaddedRows[0]).toBe(rowWithPaddingTop)
  })
})
