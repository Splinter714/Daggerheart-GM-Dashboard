import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CustomAdversaryCreator from './CustomAdversaryCreator'

// handleSave is async, so clicking Save needs a flushed microtask tick.
const clickSave = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('Save'))
  })
}

describe('CustomAdversaryCreator — Colossus type (#98)', () => {
  it('selecting the Colossus type swaps in the segment editor and hides the standard stat-block fields', () => {
    render(<CustomAdversaryCreator onSave={vi.fn()} />)

    // Type selector opens on click, showing the Colossus option.
    fireEvent.click(screen.getByText('Standard'))
    fireEvent.click(screen.getByText('Colossus'))

    expect(screen.getByText('Segments')).toBeInTheDocument()
    expect(screen.queryByText('Standard Attack')).not.toBeInTheDocument()
    expect(screen.queryByText('Attack Modifier')).not.toBeInTheDocument()
    // Thresholds/Stress (framework-level stats) still show for a Colossus.
    expect(screen.getByText('Major Threshold')).toBeInTheDocument()
    expect(screen.getByText('Stress')).toBeInTheDocument()
  })

  it('saving a Colossus with segments produces isColossus + segments data compatible with useAdversaryState', async () => {
    const onSave = vi.fn()
    render(<CustomAdversaryCreator onSave={onSave} />)

    fireEvent.change(screen.getByPlaceholderText(/Name — or search/), { target: { value: 'Test Colossus' } })
    fireEvent.click(screen.getByText('Standard'))
    fireEvent.click(screen.getByText('Colossus'))

    fireEvent.click(screen.getByTitle('Add segment'))
    fireEvent.change(screen.getByPlaceholderText('Segment name (e.g. Head)'), { target: { value: 'Head' } })

    await clickSave()

    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0][0]
    expect(saved).toMatchObject({ name: 'Test Colossus', type: 'Colossus', isColossus: true })
    expect(saved.segments).toHaveLength(1)
    expect(saved.segments[0]).toMatchObject({ name: 'Head', role: 'torso' })
  })
})

describe('CustomAdversaryCreator — live preview pill (#56)', () => {
  it('renders the Type: PREVIEW pill with the same rail-border treatment as normal group pills', () => {
    render(<CustomAdversaryCreator onSave={vi.fn()} />)

    // Narrow/mobile layout shows the preview behind a "Preview" tab toggle.
    fireEvent.click(screen.getByText('Preview'))

    expect(screen.getByText('Type: PREVIEW')).toBeInTheDocument()
    expect(screen.getByTestId('preview-rail-border')).toBeInTheDocument()
  })
})
