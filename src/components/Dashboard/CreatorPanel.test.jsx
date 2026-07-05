import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreatorPanel from './CreatorPanel'

// #102: the creator should offer a single entry point with an Adversary/
// Environment tab switcher at the top, instead of separate/hard-to-find
// navigation paths for environments specifically.
describe('CreatorPanel — unified Adversary/Environment tabs (#102)', () => {
  const baseProps = {
    isNarrow: true, // narrow layout wraps both creators in one wrapper CreatorPanel controls directly
    columnWidth: 300,
    customContent: { adversaries: [] },
    onCancel: vi.fn(),
    addCustomAdversary: vi.fn(),
    updateCustomAdversary: vi.fn(),
    createAdversary: vi.fn(),
    addCustomEnvironment: vi.fn(),
    updateCustomEnvironment: vi.fn(),
    createEnvironment: vi.fn(),
  }

  it('renders an Adversary/Environment tab switcher at the top of the creator', () => {
    render(<CreatorPanel {...baseProps} creatorContentType="adversary" setCreatorContentType={vi.fn()} />)

    expect(screen.getByText('Adversary')).toBeInTheDocument()
    expect(screen.getByText('Environment')).toBeInTheDocument()
  })

  it('clicking the Environment tab calls setCreatorContentType without leaving the creator', () => {
    const setCreatorContentType = vi.fn()
    render(<CreatorPanel {...baseProps} creatorContentType="adversary" setCreatorContentType={setCreatorContentType} />)

    fireEvent.click(screen.getByText('Environment'))
    expect(setCreatorContentType).toHaveBeenCalledWith('environment')
  })

  it('renders the environment creator form when creatorContentType is environment', () => {
    render(<CreatorPanel {...baseProps} creatorContentType="environment" setCreatorContentType={vi.fn()} />)

    expect(screen.getByPlaceholderText('Environment name')).toBeInTheDocument()
  })

  it('renders the adversary creator form when creatorContentType is adversary', () => {
    render(<CreatorPanel {...baseProps} creatorContentType="adversary" setCreatorContentType={vi.fn()} />)

    expect(screen.getByPlaceholderText(/Name — or search/)).toBeInTheDocument()
  })
})
