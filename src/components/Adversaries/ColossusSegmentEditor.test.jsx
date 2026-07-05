import { render, screen, fireEvent } from '@testing-library/react'
import { ColossusSegmentEditor } from './ColossusSegmentEditor'

// Count fields have no htmlFor/id association with their <label>, so tests
// locate the first segment's Count input by walking from its label text.
const getCountInput = (container) => {
  const labels = Array.from(container.querySelectorAll('label'))
  const countLabel = labels.find(l => l.textContent === 'Count')
  return countLabel.parentElement.querySelector('input')
}

describe('ColossusSegmentEditor', () => {
  it('shows an empty state with no segments', () => {
    render(<ColossusSegmentEditor segments={[]} onChange={vi.fn()} />)
    expect(screen.getByText(/No segments yet/i)).toBeInTheDocument()
  })

  it('adding a segment calls onChange with a new segment appended', () => {
    const onChange = vi.fn()
    render(<ColossusSegmentEditor segments={[]} onChange={onChange} />)
    fireEvent.click(screen.getByTitle('Add segment'))
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0]
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ role: 'torso', count: 1, difficulty: 14, hp: 3 })
    expect(next[0].id).toBeTruthy()
  })

  const segments = [
    { id: 'seg-1', name: 'Head', role: 'head', count: 1, difficulty: 16, hp: 5, atk: 2, weapon: 'Peck', range: 'Melee', damage: '1d10+1 phy', features: [] },
    { id: 'seg-2', name: 'Torso', role: 'torso', count: 1, difficulty: 14, hp: 8, atk: null, weapon: '', range: 'Melee', damage: '', features: [] },
  ]

  it('renders existing segments with their fields populated', () => {
    render(<ColossusSegmentEditor segments={segments} onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('Head')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Torso')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Peck')).toBeInTheDocument()
  })

  it('editing a segment field patches only that segment', () => {
    const onChange = vi.fn()
    render(<ColossusSegmentEditor segments={segments} onChange={onChange} />)
    fireEvent.change(screen.getByDisplayValue('Head'), { target: { value: 'Skull' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0]
    expect(next[0].name).toBe('Skull')
    expect(next[1].name).toBe('Torso')
  })

  it('removing a segment calls onChange without it', () => {
    const onChange = vi.fn()
    render(<ColossusSegmentEditor segments={segments} onChange={onChange} />)
    const deleteButtons = screen.getAllByTitle('Delete segment')
    fireEvent.click(deleteButtons[0])
    const next = onChange.mock.calls[0][0]
    expect(next).toHaveLength(1)
    expect(next[0].id).toBe('seg-2')
  })

  it('moving a segment down reorders the array', () => {
    const onChange = vi.fn()
    render(<ColossusSegmentEditor segments={segments} onChange={onChange} />)
    const downButtons = screen.getAllByTitle('Move down')
    fireEvent.click(downButtons[0])
    const next = onChange.mock.calls[0][0]
    expect(next.map(s => s.id)).toEqual(['seg-2', 'seg-1'])
  })

  it('adding a feature to a segment appends it to that segment features array', () => {
    const onChange = vi.fn()
    render(<ColossusSegmentEditor segments={segments} onChange={onChange} />)
    const addActionButtons = screen.getAllByText('+ Action')
    fireEvent.click(addActionButtons[0])
    const next = onChange.mock.calls[0][0]
    expect(next[0].features).toEqual([{ type: 'Action', name: '', description: '' }])
  })

  // #98: the count field must allow being cleared to an empty intermediate
  // state while typing, rather than immediately snapping back to a number,
  // so a GM can backspace the default "1" and type a different single digit.
  it('allows clearing the count field to an empty string while typing', () => {
    const onChange = vi.fn()
    const { container } = render(<ColossusSegmentEditor segments={segments} onChange={onChange} />)
    const countInput = getCountInput(container)
    fireEvent.change(countInput, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0]
    expect(next[0].count).toBe('')
  })

  it('coerces an empty count back to 1 on blur', () => {
    const onChange = vi.fn()
    const withEmptyCount = [{ ...segments[0], count: '' }, segments[1]]
    const { container } = render(<ColossusSegmentEditor segments={withEmptyCount} onChange={onChange} />)
    const countInput = getCountInput(container)
    fireEvent.blur(countInput)
    const next = onChange.mock.calls[0][0]
    expect(next[0].count).toBe(1)
  })

  it('lets the count field be overwritten with a new digit after clearing', () => {
    const onChange = vi.fn()
    const withEmptyCount = [{ ...segments[0], count: '' }, segments[1]]
    const { container } = render(<ColossusSegmentEditor segments={withEmptyCount} onChange={onChange} />)
    const countInput = getCountInput(container)
    fireEvent.change(countInput, { target: { value: '3' } })
    const next = onChange.mock.calls[0][0]
    expect(next[0].count).toBe(3)
  })
})
