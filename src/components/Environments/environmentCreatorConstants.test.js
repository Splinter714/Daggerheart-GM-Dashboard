import { ENVIRONMENT_TYPES, getDefaultDifficulty, getDefaultEnvironmentValues } from './environmentCreatorConstants'

describe('environmentCreatorConstants', () => {
  it('exposes the four SRD environment types', () => {
    expect(ENVIRONMENT_TYPES).toEqual(['Exploration', 'Social', 'Traversal', 'Event'])
  })

  it('derives a default difficulty as the midpoint of each tier range', () => {
    expect(getDefaultDifficulty(1)).toBe(11)
    expect(getDefaultDifficulty(2)).toBe(14)
    expect(getDefaultDifficulty(3)).toBe(17)
    expect(getDefaultDifficulty(4)).toBe(20)
  })

  it('falls back to tier 1 difficulty for an unknown tier', () => {
    expect(getDefaultDifficulty(99)).toBe(getDefaultDifficulty(1))
  })

  it('returns sensible blank-form defaults', () => {
    const defaults = getDefaultEnvironmentValues()
    expect(defaults).toMatchObject({
      name: '',
      tier: 1,
      type: 'Exploration',
      description: '',
      impulses: '',
      potentialAdversaries: [],
      features: [],
    })
    expect(defaults.difficulty).toBe(getDefaultDifficulty(1))
  })
})
