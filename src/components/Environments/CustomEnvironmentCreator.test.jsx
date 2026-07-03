import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CustomEnvironmentCreator from './CustomEnvironmentCreator'

// handleSave is async (awaits onSave before clearing the saving flag), so
// clicking Save needs a flushed microtask tick to avoid act() warnings.
const clickSave = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('Save'))
  })
}

describe('CustomEnvironmentCreator (#102)', () => {
  it('disables Save until a name is entered', () => {
    render(<CustomEnvironmentCreator onSave={vi.fn()} onCancelEdit={vi.fn()} />)
    expect(screen.getByText('Save')).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Environment name'), { target: { value: 'Sunken Ruins' } })
    expect(screen.getByText('Save')).not.toBeDisabled()
  })

  it('calls onSave with the trimmed name and current form fields', async () => {
    const onSave = vi.fn()
    render(<CustomEnvironmentCreator onSave={onSave} onCancelEdit={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Environment name'), { target: { value: '  Sunken Ruins  ' } })
    await clickSave()

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Sunken Ruins', tier: 1, type: 'Exploration' }),
      undefined
    )
  })

  it('lets the user pick a tier and type', async () => {
    const onSave = vi.fn()
    render(<CustomEnvironmentCreator onSave={onSave} onCancelEdit={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Environment name'), { target: { value: 'Storm Coast' } })
    fireEvent.click(screen.getByText('3'))
    fireEvent.click(screen.getByText('Traversal'))
    await clickSave()

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Storm Coast', tier: 3, type: 'Traversal' }),
      undefined
    )
  })

  it('parses potential adversaries from newline-separated text', async () => {
    const onSave = vi.fn()
    render(<CustomEnvironmentCreator onSave={onSave} onCancelEdit={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Environment name'), { target: { value: 'Storm Coast' } })
    fireEvent.change(screen.getByPlaceholderText(/One group per line/), {
      target: { value: 'Beasts (Bear)\nRaiders (Bandit)' },
    })
    await clickSave()

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ potentialAdversaries: ['Beasts (Bear)', 'Raiders (Bandit)'] }),
      undefined
    )
  })

  it('pre-fills the form when editing an existing environment and passes its id back on save', async () => {
    const onSave = vi.fn()
    const editingEnvironment = {
      id: 'env-123', name: 'Sunken Ruins', tier: 2, type: 'Exploration', difficulty: 14,
    }
    render(<CustomEnvironmentCreator onSave={onSave} onCancelEdit={vi.fn()} editingEnvironment={editingEnvironment} />)

    expect(screen.getByDisplayValue('Sunken Ruins')).toBeTruthy()
    await clickSave()

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sunken Ruins' }), 'env-123')
  })

  it('calls onCancelEdit when Cancel is clicked', () => {
    const onCancelEdit = vi.fn()
    render(<CustomEnvironmentCreator onSave={vi.fn()} onCancelEdit={onCancelEdit} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancelEdit).toHaveBeenCalled()
  })

  it('renders Action/Passive feature list sections', () => {
    render(<CustomEnvironmentCreator onSave={vi.fn()} onCancelEdit={vi.fn()} />)
    expect(screen.getByText('Actions')).toBeTruthy()
    expect(screen.getByText('Passives')).toBeTruthy()
  })
})
