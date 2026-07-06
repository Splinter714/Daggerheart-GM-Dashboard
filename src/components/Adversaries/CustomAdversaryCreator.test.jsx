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

    const pill = screen.getByText('Type: PREVIEW')
    const rail = screen.getByTestId('preview-rail-border')
    expect(pill).toBeInTheDocument()
    expect(rail).toBeInTheDocument()

    // #56: the preview pill previously floated as a bespoke rounded box with
    // a visible gap above the card instead of merging into the card's top
    // border like a normal group pill (e.g. "LEADER"). It now reuses the
    // shared GroupTabBar component, so it must render with the exact same
    // sticky/absolute-positioned, zIndex-1, top-border-merging structure as
    // a real group pill — flush top-left, no separate floating box.
    expect(pill.style.position).toBe('absolute')
    expect(pill.style.left).toBe('0px')
    expect(pill.style.zIndex).toBe('1')
    expect(pill.style.background).toBe('var(--bg-card)')
    expect(pill.style.border).toBe('2px solid var(--border)')
    expect(pill.style.borderRadius).toBe('6px')

    expect(rail.style.position).toBe('absolute')
    expect(rail.style.left).toBe('0px')
    expect(rail.style.width).toBe('100%')
    expect(rail.style.borderTop).toBeTruthy()
    expect(rail.style.borderLeft).toBeTruthy()
    expect(rail.style.borderRight).toBeTruthy()
    // Rail height must extend past the tab bar itself so it overlaps/merges
    // into the card below instead of stopping short and leaving a gap.
    // (jsdom's CSSOM folds "X - 6px" into a single combined px offset.)
    expect(rail.style.height).toMatch(/^calc\(100% - \d+px\)$/)
  })
})

describe('CustomAdversaryCreator — mobile action bar hierarchy (#67)', () => {
  it('sizes buttons to their natural content width instead of equal flex division, so labels are never ellipsis-clipped', () => {
    render(<CustomAdversaryCreator onSave={vi.fn()} onCancelEdit={vi.fn()} onSaveAndAdd={vi.fn()} onAddToEncounter={vi.fn()} />)

    const saveBtn = screen.getByText('Save').closest('button')
    const cancelBtn = screen.getByText('Cancel').closest('button')
    const previewBtn = screen.getByText('Preview').closest('button')

    for (const btn of [saveBtn, cancelBtn, previewBtn]) {
      // flex: '0 1 auto' — content-sized, not equal flex-basis:0 division (root cause of #67 clipping).
      expect(btn.style.flexGrow).toBe('0')
      expect(btn.style.flexBasis).toBe('auto')
    }

    const previewLabel = screen.getByText('Preview')
    const cancelLabel = screen.getByText('Cancel')
    // Labels must not use ellipsis/hidden-overflow truncation — that's what silently clipped
    // text under equal-width flex division before.
    expect(previewLabel.style.textOverflow).not.toBe('ellipsis')
    expect(previewLabel.style.whiteSpace).toBe('nowrap')
    expect(cancelLabel.style.textOverflow).not.toBe('ellipsis')
    expect(cancelLabel.style.whiteSpace).toBe('nowrap')

    expect(saveBtn.style.fontWeight).toBe('700')
  })

  it('shows a Save As New action on mobile when editing a homebrew adversary, matching desktop parity', () => {
    const editingAdversary = { id: 'adv-1', name: 'Test Adversary', baseName: 'Test Adversary', type: 'Standard', tier: 1 }
    render(
      <CustomAdversaryCreator
        onSave={vi.fn()}
        onCancelEdit={vi.fn()}
        editingAdversary={editingAdversary}
        isStockAdversary={false}
      />
    )

    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('does not show Save As New when creating a brand-new adversary (no editingAdversary)', () => {
    render(<CustomAdversaryCreator onSave={vi.fn()} onCancelEdit={vi.fn()} />)

    expect(screen.queryByText('New')).not.toBeInTheDocument()
  })

  // #67 follow-up: the Eye toggle's label swaps 'Preview' <-> 'Form' as the
  // active tab changes. Since the mobile action bar sizes buttons to content
  // width, that swap used to change the button's width and shift the rest
  // of the row. A fixed min-width keeps the button's footprint stable.
  it('gives the Preview/Form toggle button a stable min-width across both tab states', () => {
    render(<CustomAdversaryCreator onSave={vi.fn()} onCancelEdit={vi.fn()} />)

    const previewToggleBtn = screen.getByText('Preview').closest('button')
    expect(previewToggleBtn.style.minWidth).toBeTruthy()
    const minWidthWhenShowingPreview = previewToggleBtn.style.minWidth

    fireEvent.click(previewToggleBtn)

    const formToggleBtn = screen.getByText('Form').closest('button')
    expect(formToggleBtn.style.minWidth).toBe(minWidthWhenShowingPreview)
  })
})

describe('CustomAdversaryCreator — font-size review (#123)', () => {
  it('applies a fixed-size class so the creator form can scope placeholder font-size below input value size', () => {
    const { container } = render(<CustomAdversaryCreator onSave={vi.fn()} />)

    expect(container.querySelector('.adversary-creator')).toBeInTheDocument()
  })
})
