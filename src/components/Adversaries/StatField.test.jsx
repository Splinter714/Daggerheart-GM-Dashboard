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
})
