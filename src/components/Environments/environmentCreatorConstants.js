// Shared constants/helpers for the custom environment creator.
// Mirrors src/components/Adversaries/customCreatorConstants.js in spirit, but
// scoped to the much lighter environment data shape (see environments.json).

export const ENVIRONMENT_TYPES = ['Exploration', 'Social', 'Traversal', 'Event']

// Difficulty default per tier — midpoint of the SRD's difficultyRange for that
// tier (see environments.json "environmentTiers").
const TIER_DIFFICULTY_RANGE = {
  1: [10, 12],
  2: [13, 15],
  3: [16, 18],
  4: [19, 20],
}

export const getDefaultDifficulty = (tier) => {
  const range = TIER_DIFFICULTY_RANGE[tier] || TIER_DIFFICULTY_RANGE[1]
  return Math.ceil((range[0] + range[1]) / 2)
}

export const getDefaultEnvironmentValues = () => ({
  name: '',
  tier: 1,
  type: 'Exploration',
  description: '',
  impulses: '',
  difficulty: getDefaultDifficulty(1),
  potentialAdversaries: [],
  features: [],
})
