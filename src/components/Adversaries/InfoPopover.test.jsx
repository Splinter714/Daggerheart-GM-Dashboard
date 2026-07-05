import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { InfoPopover } from './InfoPopover'

// #123 (2026-07-05 playtest): the separate circular "i" icon button was
// replaced with a dashed-underline on the field's label text itself, so the
// label is now the click/hover target that opens the popover — freeing up
// the horizontal space the icon used to take.
describe('InfoPopover — label-as-trigger (#123)', () => {
  it('renders the label as a dashed-underline trigger and shows content on click', () => {
    render(
      <InfoPopover label="Tier">
        <div>PC Levels by Tier</div>
      </InfoPopover>
    )

    const trigger = screen.getByText('Tier')
    expect(trigger.closest('button')).toBeInTheDocument()
    expect(trigger.closest('button')).toHaveStyle({ textDecorationStyle: 'dashed' })

    expect(screen.queryByText('PC Levels by Tier')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.getByText('PC Levels by Tier')).toBeInTheDocument()
  })

  it('opens the popover on hover (mouse enter) of the label, not just click', () => {
    render(
      <InfoPopover label="Stress">
        <div>Stress guide content</div>
      </InfoPopover>
    )

    const trigger = screen.getByText('Stress')
    expect(screen.queryByText('Stress guide content')).not.toBeInTheDocument()
    fireEvent.mouseEnter(trigger.closest('button'))
    expect(screen.getByText('Stress guide content')).toBeInTheDocument()
  })

  it('does not render a separate circular icon button next to the label', () => {
    render(
      <InfoPopover label="Type">
        <div>Adversary Types</div>
      </InfoPopover>
    )

    // Only one button should exist — the label itself — not an icon plus a label.
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
