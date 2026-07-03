import { renderHook, act } from '@testing-library/react'
import { useCustomContentState } from './useCustomContentState'

beforeEach(() => localStorage.clear())

describe('useCustomContentState — custom adversaries', () => {
  it('adds a custom adversary and returns its id', () => {
    const { result } = renderHook(() => useCustomContentState())
    let id
    act(() => {
      id = result.current.addCustomAdversary({ name: 'Goblin', tier: 1, type: 'Standard' })
    })

    expect(id).toBeTruthy()
    expect(result.current.customContent.adversaries).toHaveLength(1)
    expect(result.current.customContent.adversaries[0]).toMatchObject({
      name: 'Goblin', source: 'Homebrew', isCustom: true,
    })
  })

  it('updates a custom adversary by id', () => {
    const { result } = renderHook(() => useCustomContentState())
    let id
    act(() => { id = result.current.addCustomAdversary({ name: 'Goblin' }) })
    act(() => result.current.updateCustomAdversary(id, { name: 'Goblin Boss' }))

    expect(result.current.customContent.adversaries[0].name).toBe('Goblin Boss')
  })

  it('deletes a custom adversary by id', () => {
    const { result } = renderHook(() => useCustomContentState())
    let id
    act(() => { id = result.current.addCustomAdversary({ name: 'Goblin' }) })
    act(() => result.current.deleteCustomAdversary(id))

    expect(result.current.customContent.adversaries).toHaveLength(0)
  })
})

describe('useCustomContentState — custom environments (#102)', () => {
  it('adds a custom environment and returns its id', () => {
    const { result } = renderHook(() => useCustomContentState())
    let id
    act(() => {
      id = result.current.addCustomEnvironment({ name: 'Sunken Ruins', tier: 2, type: 'Exploration' })
    })

    expect(id).toBeTruthy()
    expect(result.current.customContent.environments).toHaveLength(1)
    expect(result.current.customContent.environments[0]).toMatchObject({
      name: 'Sunken Ruins', source: 'Homebrew', isCustom: true,
    })
  })

  it('updates a custom environment by id', () => {
    const { result } = renderHook(() => useCustomContentState())
    let id
    act(() => { id = result.current.addCustomEnvironment({ name: 'Sunken Ruins' }) })
    act(() => result.current.updateCustomEnvironment(id, { name: 'Flooded Ruins' }))

    expect(result.current.customContent.environments[0].name).toBe('Flooded Ruins')
  })

  it('deletes a custom environment by id', () => {
    const { result } = renderHook(() => useCustomContentState())
    let id
    act(() => { id = result.current.addCustomEnvironment({ name: 'Sunken Ruins' }) })
    act(() => result.current.deleteCustomEnvironment(id))

    expect(result.current.customContent.environments).toHaveLength(0)
  })

  it('keeps custom adversaries and environments independent', () => {
    const { result } = renderHook(() => useCustomContentState())
    act(() => {
      result.current.addCustomAdversary({ name: 'Goblin' })
      result.current.addCustomEnvironment({ name: 'Sunken Ruins' })
    })

    expect(result.current.customContent.adversaries).toHaveLength(1)
    expect(result.current.customContent.environments).toHaveLength(1)
  })
})
