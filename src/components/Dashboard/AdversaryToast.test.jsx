import { render, screen } from '@testing-library/react'
import AdversaryToast from './AdversaryToast'

// #115: playtest feedback — the toast should sit at the top of the screen
// (not the bottom) and use the app's card background, not plain black.
describe('AdversaryToast', () => {
  it('renders the message', () => {
    render(<AdversaryToast message="Goblin added" />)
    expect(screen.getByText('Goblin added')).toBeInTheDocument()
  })

  it('is positioned at the top of the screen, not the bottom', () => {
    render(<AdversaryToast message="Goblin added" />)
    const toast = screen.getByRole('status')
    expect(toast.style.top).toContain('safe-area-inset-top')
    expect(toast.style.bottom).toBe('')
  })

  it('uses the card background instead of the primary (black) background', () => {
    render(<AdversaryToast message="Goblin added" />)
    const toast = screen.getByRole('status')
    expect(toast.style.backgroundColor).toBe('var(--bg-card)')
  })
})
