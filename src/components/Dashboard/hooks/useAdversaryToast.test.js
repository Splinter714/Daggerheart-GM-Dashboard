import { renderHook, act } from '@testing-library/react'
import { useAdversaryToast, TOAST_DURATION_MS } from './useAdversaryToast'

describe('useAdversaryToast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts with no message', () => {
    const { result } = renderHook(() => useAdversaryToast())
    expect(result.current.toastMessage).toBeNull()
  })

  it('shows "<Name> added" when triggered', () => {
    const { result } = renderHook(() => useAdversaryToast())
    act(() => result.current.showAdversaryToast('Goblin'))
    expect(result.current.toastMessage).toBe('Goblin added')
  })

  it('clears the message after the toast duration', () => {
    const { result } = renderHook(() => useAdversaryToast())
    act(() => result.current.showAdversaryToast('Goblin'))
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS))
    expect(result.current.toastMessage).toBeNull()
  })

  it('restarts the timer and updates the message when triggered again before it clears', () => {
    const { result } = renderHook(() => useAdversaryToast())
    act(() => result.current.showAdversaryToast('Goblin'))
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 100))
    act(() => result.current.showAdversaryToast('Bear'))
    expect(result.current.toastMessage).toBe('Bear added')
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 100))
    // Original timer would have fired by now, but should have been cleared
    expect(result.current.toastMessage).toBe('Bear added')
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.toastMessage).toBeNull()
  })

  it('ignores empty/undefined names', () => {
    const { result } = renderHook(() => useAdversaryToast())
    act(() => result.current.showAdversaryToast(undefined))
    expect(result.current.toastMessage).toBeNull()
  })
})
