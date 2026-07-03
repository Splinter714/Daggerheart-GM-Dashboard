// Shared battle points calculation utilities
// Used by DashboardView, EncounterBuilder, and Browser components

export const BATTLE_POINT_COSTS = {
  'Minion': 1, // per group equal to party size
  'Social': 1,
  'Support': 1,
  'Horde': 2,
  'Ranged': 2,
  'Skulk': 2,
  'Standard': 2,
  'Leader': 3,
  'Bruiser': 4,
  'Solo': 5
}

export const BATTLE_POINT_ADJUSTMENTS = {
  lessDifficult: -1,
  twoOrMoreSolos: -2,
  increasedDamage: -2,
  lowerTierAdversary: 1,
  noBruisersHordesLeadersSolos: 1,
  moreDangerous: 2
}

export function calculateBaseBattlePoints(pcCount) {
  return (3 * pcCount) + 2
}

export function calculateSpentBattlePoints(encounterItems, pcCount) {
  return encounterItems.reduce((total, item) => {
    // Colossi are the encounter (or boss centerpiece) — they never participate in the
    // BP budget system, so skip them entirely rather than costing them like a normal
    // adversary type (#99).
    if (item.type === 'adversary' && item.item.type !== 'Colossus') {
      const cost = BATTLE_POINT_COSTS[item.item.type] || 2
      if (item.item.type === 'Minion') {
        return total + (Math.ceil(item.quantity / pcCount) * cost)
      }
      return total + (cost * item.quantity)
    }
    return total
  }, 0)
}

export function calculateAutomaticAdjustments(encounterItems) {
  let adjustments = 0
  
  // Check for 2 or more Solo adversaries (only count those with quantity > 0)
  const soloCount = encounterItems
    .filter(item => item.type === 'adversary' && item.item.type === 'Solo' && item.quantity > 0)
    .reduce((sum, item) => sum + item.quantity, 0)
  if (soloCount >= 2) {
    adjustments += BATTLE_POINT_ADJUSTMENTS.twoOrMoreSolos
  }
  
  // Check if no Bruisers, Hordes, Leaders, or Solos (only count those with quantity > 0)
  const hasMajorThreats = encounterItems.some(item => 
    item.type === 'adversary' && 
    item.item.type && 
    ['Bruiser', 'Horde', 'Leader', 'Solo'].includes(item.item.type) && 
    item.quantity > 0
  )
  
  if (!hasMajorThreats) {
    adjustments += BATTLE_POINT_ADJUSTMENTS.noBruisersHordesLeadersSolos
  }
  
  return adjustments
}

export function calculateAvailableBattlePoints(pcCount, manualAdjustments = {}) {
  const baseBattlePoints = calculateBaseBattlePoints(pcCount)
  const manualAdjustmentTotal = Object.entries(manualAdjustments)
    .filter(([_, enabled]) => enabled)
    .reduce((sum, [key, _]) => sum + BATTLE_POINT_ADJUSTMENTS[key], 0)
  return baseBattlePoints + manualAdjustmentTotal
}

