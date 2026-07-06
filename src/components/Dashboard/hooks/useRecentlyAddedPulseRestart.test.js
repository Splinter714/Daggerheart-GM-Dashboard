import { renderHook } from '@testing-library/react'
import { useRecentlyAddedPulseRestart } from './useRecentlyAddedPulseRestart'

// #55 round 3 (2026-07-05 playtest): "it fades in, but only when the
// adversary type itself is brand new". Root cause — reapplying the identical
// 'card-recently-added' className across renders is a DOM no-op, so a 2nd
// add on a card that's already mid-pulse never actually restarted the CSS
// animation, even though the code technically "fired" on every add. This
// hook is the fix: it force-restarts the class via direct DOM manipulation
// whenever a card's pulse token changes.
function makeCard(cardKey, { pulsing = true } = {}) {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-card-key', cardKey)
  const inner = document.createElement('div')
  if (pulsing) inner.classList.add('card-recently-added')
  wrapper.appendChild(inner)
  return { wrapper, inner }
}

describe('useRecentlyAddedPulseRestart', () => {
  it('removes then re-adds the pulse class on the matching card when its token changes', () => {
    const { wrapper, inner } = makeCard('adversary-Bear')
    document.body.appendChild(wrapper)
    const containerRef = { current: document.body }

    const { rerender } = renderHook(
      ({ cards }) => useRecentlyAddedPulseRestart(cards, containerRef),
      { initialProps: { cards: new Map([['adversary-Bear', 100]]) } }
    )

    const removeSpy = vi.spyOn(inner.classList, 'remove')
    const addSpy = vi.spyOn(inner.classList, 'add')

    rerender({ cards: new Map([['adversary-Bear', 200]]) })

    expect(removeSpy).toHaveBeenCalledWith('card-recently-added')
    expect(addSpy).toHaveBeenCalledWith('card-recently-added')
    expect(inner.classList.contains('card-recently-added')).toBe(true)

    document.body.removeChild(wrapper)
  })

  it('does not touch the DOM when the token for a card is unchanged', () => {
    const { wrapper, inner } = makeCard('adversary-Bear')
    document.body.appendChild(wrapper)
    const containerRef = { current: document.body }

    const { rerender } = renderHook(
      ({ cards }) => useRecentlyAddedPulseRestart(cards, containerRef),
      { initialProps: { cards: new Map([['adversary-Bear', 100]]) } }
    )

    const removeSpy = vi.spyOn(inner.classList, 'remove')
    rerender({ cards: new Map([['adversary-Bear', 100]]) }) // same token — no-op

    expect(removeSpy).not.toHaveBeenCalled()
    document.body.removeChild(wrapper)
  })

  it('is a no-op when no matching DOM node exists for a card key', () => {
    const containerRef = { current: document.createElement('div') }
    const { rerender } = renderHook(
      ({ cards }) => useRecentlyAddedPulseRestart(cards, containerRef),
      { initialProps: { cards: new Map([['adversary-Ghost', 1]]) } }
    )
    expect(() => rerender({ cards: new Map([['adversary-Ghost', 2]]) })).not.toThrow()
  })
})
