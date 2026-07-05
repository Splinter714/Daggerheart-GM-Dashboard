import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TypeSelector, TypeInfoContent } from './TypeSelector'

describe('TypeSelector', () => {
  it('does not show a per-row type description when the dropdown is open (#125)', () => {
    render(<TypeSelector selectedType="Standard" onTypeChange={vi.fn()} />)
    fireEvent.click(screen.getByText('Standard'))
    // "Bruiser" row should render with no accompanying summary text.
    expect(screen.getByText('Bruiser')).toBeInTheDocument()
    expect(screen.queryByText(/High HP, big hits/)).not.toBeInTheDocument()
  })

  it('selecting a type calls onTypeChange and closes the dropdown', () => {
    const onTypeChange = vi.fn()
    render(<TypeSelector selectedType="Standard" onTypeChange={onTypeChange} />)
    fireEvent.click(screen.getByText('Standard'))
    fireEvent.click(screen.getByText('Bruiser'))
    expect(onTypeChange).toHaveBeenCalledWith('Bruiser')
    expect(screen.queryByText(/High HP, big hits/)).not.toBeInTheDocument()
  })
})

describe('TypeInfoContent', () => {
  it('lists every type with its summary, for use in an InfoPopover next to the Type label (#125)', () => {
    render(<TypeInfoContent selectedType="Bruiser" />)
    expect(screen.getByText('Bruiser')).toBeInTheDocument()
    expect(screen.getByText(/High HP, big hits/)).toBeInTheDocument()
    expect(screen.getByText('Standard')).toBeInTheDocument()
  })
})
