import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StatField } from './StatField'

const baseFormData = { atk: 2 }

describe('StatField — compact number display (#41)', () => {
  it('renders the number input with a slim, quick-edit-style treatment (small font, tight padding, tabular-nums)', () => {
    render(
      <StatField
        label="Attack Modifier"
        field="atk"
        rangeKey="atk"
        formData={baseFormData}
        setFormData={vi.fn()}
        adversaryType="Standard"
        currentTier={1}
      />
    )

    const input = screen.getByDisplayValue('2')
    expect(input.style.fontSize).toBe('0.85rem')
    expect(input.style.height).toBe('1.5rem')
    expect(input.style.fontVariantNumeric).toBe('tabular-nums')
  })

  // #122: after #41 slimmed the stepper vertically, Jackson asked for it
  // narrower horizontally too, matching quick-edit mode's tighter width
  // (VitalRow's 2.5rem number input in StatusSection.jsx) instead of
  // stretching to fill the row.
  it('renders the number input with a fixed narrow width matching quick-edit mode (#122)', () => {
    render(
      <StatField
        label="Attack Modifier"
        field="atk"
        rangeKey="atk"
        formData={baseFormData}
        setFormData={vi.fn()}
        adversaryType="Standard"
        currentTier={1}
      />
    )

    const input = screen.getByDisplayValue('2')
    expect(input.style.width).toBe('2.5rem')
  })

  // #122 follow-up: Jackson asked for the -/number/+ button group to be
  // center-aligned within its column, not left-aligned.
  it('center-aligns the stepper button group within its column (#122)', () => {
    render(
      <StatField
        label="Attack Modifier"
        field="atk"
        rangeKey="atk"
        formData={baseFormData}
        setFormData={vi.fn()}
        adversaryType="Standard"
        currentTier={1}
      />
    )

    const input = screen.getByDisplayValue('2')
    const stepperRow = input.parentElement
    expect(stepperRow.style.justifyContent).toBe('center')
  })
})
