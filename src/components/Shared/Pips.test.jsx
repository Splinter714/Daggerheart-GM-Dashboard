import { render, fireEvent } from '@testing-library/react'
import Pips from './Pips'

// #30 mobile touch-target audit, Priority 2: individually-clickable pips
// (enableBoundaryClick=false, e.g. adversary HP/Stress trackers) get an
// invisible 44x44px hit-area wrapper so the visual pip can stay small.
describe('Pips individually-clickable hit areas (#30)', () => {
  it('wraps each dot pip in a 44x44px hit area when individually clickable', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Pips type="hpDots" value={2} maxValue={5} onChange={onChange} showTooltip={false} />
    )
    const wrappers = container.querySelectorAll('span[style*="44px"]')
    expect(wrappers.length).toBe(5)
  })

  it('still calls onChange when a wrapped pip is clicked', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Pips type="hpDots" value={2} maxValue={5} onChange={onChange} showTooltip={false} />
    )
    const dot = container.querySelector('[title="1 of 5"]')
    fireEvent.click(dot)
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('does not add hit-area wrappers for boundary-click pips (e.g. fear tracker)', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Pips type="fear" value={3} maxValue={6} onChange={onChange} enableBoundaryClick showTooltip={false} />
    )
    const wrappers = container.querySelectorAll('span[style*="44px"]')
    expect(wrappers.length).toBe(0)
  })
})
