import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { InfoPopover } from './InfoPopover'

// Helper to stub window.matchMedia('(hover: none)') for a given hover
// capability, mirroring how real browsers report touch-only vs. mouse
// devices via the `hover` media feature.
const setHoverCapable = (hoverCapable) => {
  window.matchMedia = (query) => ({
    matches: query === '(hover: none)' ? !hoverCapable : false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false },
  })
}

// #123 (2026-07-05 playtest): the separate circular "i" icon button was
// replaced with a dashed-underline on the field's label text itself, so the
// label is now the click/hover target that opens the popover — freeing up
// the horizontal space the icon used to take.
describe('InfoPopover — label-as-trigger (#123)', () => {
  it('renders the label as a dashed-underline trigger and shows content on click', () => {
    render(
      <InfoPopover label="Tier">
        <div>PC Levels by Tier</div>
      </InfoPopover>
    )

    const trigger = screen.getByText('Tier')
    expect(trigger.closest('button')).toBeInTheDocument()
    expect(trigger.closest('button')).toHaveStyle({ textDecorationStyle: 'dashed' })

    expect(screen.queryByText('PC Levels by Tier')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.getByText('PC Levels by Tier')).toBeInTheDocument()
  })

  it('opens the popover on hover (mouse enter) of the label, not just click', () => {
    render(
      <InfoPopover label="Stress">
        <div>Stress guide content</div>
      </InfoPopover>
    )

    const trigger = screen.getByText('Stress')
    expect(screen.queryByText('Stress guide content')).not.toBeInTheDocument()
    fireEvent.mouseEnter(trigger.closest('button'))
    expect(screen.getByText('Stress guide content')).toBeInTheDocument()
  })

  it('does not render a separate circular icon button next to the label', () => {
    render(
      <InfoPopover label="Type">
        <div>Adversary Types</div>
      </InfoPopover>
    )

    // Only one button should exist — the label itself — not an icon plus a label.
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})

// #123 (2026-07-05 playtest, part 2): on desktop the popover used to stay
// open until the user clicked outside it. It should instead auto-close a
// short beat after the mouse leaves both the trigger and the panel — but
// touch/tap-only devices (no hover state) keep the original
// tap-elsewhere-to-close behavior.
describe('InfoPopover — hover auto-close (#123)', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.matchMedia = originalMatchMedia
  })

  it('auto-closes after a brief delay once the mouse leaves the trigger on hover-capable devices', () => {
    setHoverCapable(true)
    render(
      <InfoPopover label="Difficulty">
        <div>Difficulty guide content</div>
      </InfoPopover>
    )

    const trigger = screen.getByText('Difficulty').closest('button')
    fireEvent.mouseEnter(trigger)
    expect(screen.getByText('Difficulty guide content')).toBeInTheDocument()

    fireEvent.mouseLeave(trigger)
    // Not closed immediately.
    expect(screen.getByText('Difficulty guide content')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(400))
    expect(screen.queryByText('Difficulty guide content')).not.toBeInTheDocument()
  })

  it('does not close if the mouse moves from the trigger into the popover panel', () => {
    setHoverCapable(true)
    render(
      <InfoPopover label="Thresholds">
        <div>Thresholds guide content</div>
      </InfoPopover>
    )

    const trigger = screen.getByText('Thresholds').closest('button')
    fireEvent.mouseEnter(trigger)
    expect(screen.getByText('Thresholds guide content')).toBeInTheDocument()

    fireEvent.mouseLeave(trigger)
    // Cursor moves into the panel before the close timeout would fire.
    const panel = screen.getByText('Thresholds guide content').closest('div')
    fireEvent.mouseEnter(panel)

    act(() => vi.advanceTimersByTime(400))
    expect(screen.getByText('Thresholds guide content')).toBeInTheDocument()

    // Leaving the panel itself still schedules the close.
    fireEvent.mouseLeave(panel)
    act(() => vi.advanceTimersByTime(400))
    expect(screen.queryByText('Thresholds guide content')).not.toBeInTheDocument()
  })

  it('keeps tap-outside-to-close on touch/no-hover devices instead of auto-closing on mouse leave', () => {
    setHoverCapable(false)
    render(
      <InfoPopover label="HP">
        <div>HP guide content</div>
      </InfoPopover>
    )

    const trigger = screen.getByText('HP').closest('button')
    fireEvent.click(trigger)
    expect(screen.getByText('HP guide content')).toBeInTheDocument()

    // No hover to leave — mouseLeave should not schedule/trigger a close.
    fireEvent.mouseLeave(trigger)
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('HP guide content')).toBeInTheDocument()

    // Tapping outside still closes it.
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('HP guide content')).not.toBeInTheDocument()
  })
})

// #123 (2026-07-05 playtest screenshot): the threshold-guide popover (T/Diff/
// Maj/Sev/HP/Stress/ATK table) positioned off-screen to the right when its
// trigger sat near the right edge of the viewport, clipping the rightmost
// column. InfoPopover's useLayoutEffect measures the rendered panel against
// the nearest clip boundary (a scrollable ancestor, or the viewport) and
// shifts it back on-screen via a translateX — mirrors the existing flip-up
// vertical-overflow handling.
describe('InfoPopover — horizontal overflow clamp (#123)', () => {
  const origGBCR = HTMLElement.prototype.getBoundingClientRect

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = origGBCR
  })

  it('shifts the panel left (via transform) when it would overflow the right edge of the viewport', () => {
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true })

    render(
      <InfoPopover label="ATK" minWidth={220}>
        <div>Thresholds table</div>
      </InfoPopover>
    )

    // Simulate the trigger sitting near the right edge of a 400px viewport:
    // a left-anchored 320px-wide panel would overflow to x=700.
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.textContent && this.textContent.includes('Thresholds table')) {
        return { left: 380, right: 380 + 320, top: 50, bottom: 150, width: 320, height: 100 }
      }
      return origGBCR.call(this)
    }

    const trigger = screen.getByText('ATK')
    fireEvent.click(trigger)

    const panel = screen.getByText('Thresholds table').parentElement
    // dx = clipRight(400) - MARGIN(8) - rect.right(700) = -308
    expect(panel).toHaveStyle({ transform: 'translateX(-308px)' })
  })

  it('does not shift the panel when it already fits within the viewport', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })

    render(
      <InfoPopover label="ATK" minWidth={220}>
        <div>Thresholds table</div>
      </InfoPopover>
    )

    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.textContent && this.textContent.includes('Thresholds table')) {
        return { left: 100, right: 100 + 320, top: 50, bottom: 150, width: 320, height: 100 }
      }
      return origGBCR.call(this)
    }

    const trigger = screen.getByText('ATK')
    fireEvent.click(trigger)

    const panel = screen.getByText('Thresholds table').parentElement
    expect(panel).toHaveStyle({ transform: 'none' })
  })
})
