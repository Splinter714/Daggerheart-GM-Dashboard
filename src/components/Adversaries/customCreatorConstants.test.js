import { describe, it, expect } from 'vitest'
import { labelStyle } from './customCreatorConstants'

describe('customCreatorConstants — labelStyle font-size review (#123)', () => {
  it('uses a font-size small enough that uppercase stat labels (e.g. ATTACK MODIFIER, MAJOR THRESHOLD) wrap less readily in narrow two-column layouts', () => {
    expect(parseFloat(labelStyle.fontSize)).toBeLessThanOrEqual(0.7)
  })
})
