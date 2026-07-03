import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BrowserHeader from './BrowserHeader'

const baseProps = {
  searchTerm: '',
  onSearchChange: vi.fn(),
  type: 'adversary',
}

describe('BrowserHeader', () => {
  it('does not render a BP badge when remainingBudget is not provided', () => {
    render(<BrowserHeader {...baseProps} />)
    expect(screen.queryByText(/BP left/)).toBeNull()
    expect(screen.queryByText(/BP over/)).toBeNull()
  })

  it('shows the running BP total while the adversary browser is open (#31)', () => {
    render(<BrowserHeader {...baseProps} remainingBudget={5} />)
    expect(screen.getByText('5 BP left')).toBeTruthy()
  })

  it('flags an over-budget encounter distinctly', () => {
    render(<BrowserHeader {...baseProps} remainingBudget={-3} />)
    expect(screen.getByText('3 BP over')).toBeTruthy()
  })
})
