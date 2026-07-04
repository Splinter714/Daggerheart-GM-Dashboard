import { render, screen, fireEvent } from '@testing-library/react'
import TouchTarget from './TouchTarget'

// #30 mobile touch-target audit: TouchTarget expands the *clickable* area of
// a small/dense control to 44x44px (the interactive element itself, since an
// absolutely-positioned overflow child would not expand real click
// hit-testing) while keeping the visible child at its own small size, using
// a negative margin so it doesn't push neighboring elements apart.
describe('TouchTarget', () => {
  it('sizes the button itself to 44x44 by default and centers the small visual child', () => {
    render(
      <TouchTarget title="Example" style={{ width: '1.5rem', height: '1.5rem' }}>
        <span data-testid="icon">X</span>
      </TouchTarget>
    )
    const btn = screen.getByTitle('Example')
    expect(btn.tagName).toBe('BUTTON')
    expect(btn.style.width).toBe('44px')
    expect(btn.style.height).toBe('44px')
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('applies a negative margin equal to the overflow so it does not grow visually in-flow', () => {
    render(
      <TouchTarget title="Example" visualSize={24}>
        <span>x</span>
      </TouchTarget>
    )
    const btn = screen.getByTitle('Example')
    // (44 - 24) / 2 = 10px overflow on each side
    expect(btn.style.margin).toBe('-10px');
  })

  it('fires onClick when clicked', () => {
    const onClick = vi.fn()
    render(
      <TouchTarget title="Tap me" onClick={onClick}>
        <span>tap</span>
      </TouchTarget>
    )
    fireEvent.click(screen.getByTitle('Tap me'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('supports a custom size for the hit area', () => {
    render(
      <TouchTarget title="Custom size" size={32} visualSize={32}>
        <span>x</span>
      </TouchTarget>
    )
    const btn = screen.getByTitle('Custom size')
    expect(btn.style.width).toBe('32px')
    expect(btn.style.height).toBe('32px')
  })

  it('respects the disabled prop', () => {
    const onClick = vi.fn()
    render(
      <TouchTarget title="Disabled" onClick={onClick} disabled>
        <span>x</span>
      </TouchTarget>
    )
    const btn = screen.getByTitle('Disabled')
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })
})
