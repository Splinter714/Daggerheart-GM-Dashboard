import { describe, it, expect } from 'vitest'
import {
  calculateBaseBattlePoints,
  calculateSpentBattlePoints,
  calculateAutomaticAdjustments,
  calculateAvailableBattlePoints,
} from './BattlePointsCalculator'

describe('calculateSpentBattlePoints', () => {
  it('costs a Standard adversary at its flat BP cost per quantity', () => {
    const items = [{ type: 'adversary', item: { type: 'Standard' }, quantity: 2 }]
    expect(calculateSpentBattlePoints(items, 4)).toBe(4) // 2 BP each
  })

  it('costs Minions per group equal to party size', () => {
    const items = [{ type: 'adversary', item: { type: 'Minion' }, quantity: 4 }]
    expect(calculateSpentBattlePoints(items, 4)).toBe(1)
  })

  it('excludes Colossus items from the BP sum entirely (#99)', () => {
    const items = [
      { type: 'adversary', item: { type: 'Colossus' }, quantity: 1 },
      { type: 'adversary', item: { type: 'Colossus' }, quantity: 1 },
    ]
    expect(calculateSpentBattlePoints(items, 4)).toBe(0)
  })

  it('sums non-Colossus items while ignoring Colossus rows mixed in', () => {
    const items = [
      { type: 'adversary', item: { type: 'Colossus' }, quantity: 1 },
      { type: 'adversary', item: { type: 'Standard' }, quantity: 1 },
    ]
    expect(calculateSpentBattlePoints(items, 4)).toBe(2)
  })
})

describe('calculateAutomaticAdjustments', () => {
  it('does not treat Colossus as a major threat for the "no major threats" bonus', () => {
    const items = [{ type: 'adversary', item: { type: 'Colossus' }, quantity: 1 }]
    // A colossus-only encounter has no Bruiser/Horde/Leader/Solo, so the
    // "no major threats" automatic adjustment still applies.
    expect(calculateAutomaticAdjustments(items)).toBe(1)
  })
})

describe('base/available battle points', () => {
  it('computes base BP from party size', () => {
    expect(calculateBaseBattlePoints(4)).toBe(14)
  })

  it('applies manual adjustments on top of base BP', () => {
    expect(calculateAvailableBattlePoints(4, { lessDifficult: true })).toBe(13)
  })
})
