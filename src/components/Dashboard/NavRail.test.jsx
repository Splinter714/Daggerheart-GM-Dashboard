import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NavRail from './NavRail'

describe('NavRail (#111: info icon now reads as Settings)', () => {
  it('labels the info-panel trigger "Settings" rather than "App info"', () => {
    render(<NavRail placement="right" activeId={null} onAction={vi.fn()} />)
    expect(screen.getByTitle('Settings')).toBeTruthy()
    expect(screen.queryByTitle('App info')).toBeNull()
  })
})
