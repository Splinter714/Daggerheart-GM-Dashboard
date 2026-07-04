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

const baseProps = {
  colossus,
  segment,
  segmentKey: 'ikeri-head',
  instanceNumber: 1,
  markedHp: 0,
  onToggleHpPip: vi.fn(),
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
    expect(screen.getAllByText((_, el) => el?.textContent === 'Head #1').length).toBeGreaterThan(0)
    expect(screen.getByText('16')).toBeInTheDocument() // difficulty badge value
    expect(screen.getByText('+2')).toBeInTheDocument() // ATK badge value
    expect(screen.getByText('Peck')).toBeInTheDocument()
  })

  it('HP pips are interactable — clicking a pip calls onToggleHpPip with its index', () => {
    const onToggleHpPip = vi.fn()
    const { container } = render(<ColossusSegmentCard {...baseProps} onToggleHpPip={onToggleHpPip} />)

    // HP pips render as 5 clickable divs (segment.hp = 5)
    const pips = container.querySelectorAll('[style*="border-radius: 50%"]')
    expect(pips.length).toBeGreaterThanOrEqual(5)

    fireEvent.click(pips[2])
    expect(onToggleHpPip).toHaveBeenCalledWith(2)
  })

  it('shows Destroyed label when all HP is marked', () => {
    render(<ColossusSegmentCard {...baseProps} markedHp={5} />)
    expect(screen.getByText('Destroyed')).toBeInTheDocument()
  })

  it('shows Broken label at half HP marked', () => {
    render(<ColossusSegmentCard {...baseProps} markedHp={3} />)
    expect(screen.getByText('Broken')).toBeInTheDocument()
  })

  it('renders parent colossus name for context', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText('Ikeri, Injuries Untold')).toBeInTheDocument()
  })

  it('shows the running instance number in the header (#109)', () => {
    render(<ColossusSegmentCard {...baseProps} instanceNumber={4} />)
    expect(screen.getAllByText((_, el) => el?.textContent === 'Head #4').length).toBeGreaterThan(0)
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

  it('shows shared Stress pips and toggling one calls onUpdate with the shared instance stress field (#109)', () => {
    const onUpdate = vi.fn()
    const { container } = render(<ColossusSegmentCard {...baseProps} onUpdate={onUpdate} />)
    expect(screen.getByText('Stress')).toBeInTheDocument()
    const pips = container.querySelectorAll('[style*="border-radius: 50%"]')
    // 5 HP pips + 6 Stress pips
    expect(pips.length).toBe(11)
    // inst.stress = 2 (from the shared `inst` fixture); clicking the first
    // stress pip (index 0 within the marked range) unmarks down to 0.
    fireEvent.click(pips[5]) // first stress pip
    expect(onUpdate).toHaveBeenCalledWith('adv-1', { stress: 0 })
  })

  it('shows both segment-specific and framework-wide features, clearly distinguished (#109)', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText('Fatal')).toBeInTheDocument()
    expect(screen.getByText('Colossal Power')).toBeInTheDocument()
    expect(screen.getByText('Colossus Features')).toBeInTheDocument()
  })

  // #79: the DIFF/ATK/thresholds badges are fixed-size and must not shrink —
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
