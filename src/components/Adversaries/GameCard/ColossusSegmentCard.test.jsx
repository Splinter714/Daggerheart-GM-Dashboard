import { render, screen, fireEvent } from '@testing-library/react'
import ColossusSegmentCard from './ColossusSegmentCard'

const colossus = { name: 'Ikeri, Injuries Untold', tier: 1 }
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

const baseProps = {
  colossus,
  segment,
  segmentKey: 'ikeri-head',
  markedHp: 0,
  onToggleHpPip: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  getCardStyle: () => ({ backgroundColor: 'var(--bg-card)' }),
  quickEdit: false,
  setQuickEdit: vi.fn(),
}

describe('ColossusSegmentCard', () => {
  it('renders segment name, difficulty, ATK, and weapon using regular adversary card conventions', () => {
    render(<ColossusSegmentCard {...baseProps} />)
    expect(screen.getByText('Head')).toBeInTheDocument()
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
})
