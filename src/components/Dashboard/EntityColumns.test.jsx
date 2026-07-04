import { render } from '@testing-library/react'
import { createRef } from 'react'
import EntityColumns from './EntityColumns'
import GameCard from '../Adversaries/GameCard'

vi.mock('../Adversaries/GameCard', () => ({
  default: vi.fn(() => null),
}))

// Covers #86: the grouper rail's left edge must be pinned the same way as the
// group-name pill (sticky), not a plain absolute box spanning the whole
// section wrapper — otherwise, once the section scrolls partway offscreen,
// the rail's left edge trails behind the pinned pill and peeks out past its
// left side. jsdom doesn't compute real sticky layout, so this test asserts
// the structural fix (a separate sticky left-edge element) rather than
// pixel positions, which the browser-level check in this session verified.

const group = (baseName, type) => ({
  type: 'adversary',
  baseName,
  groupName: type,
  template: { baseName, type, hpMax: 5, stressMax: 2 },
  instances: [{ id: `${baseName}-1`, duplicateNumber: 1, hp: 0, stress: 0, isVisible: true }],
})

const noop = () => {}

describe('EntityColumns grouper rail (#86)', () => {
  it('renders the rail left-edge as its own sticky element, separate from the absolute-positioned top/right rail', () => {
    const entityGroups = [group('Bear', 'Bruiser'), group('Head Guard', 'Leader')]

    const { container } = render(
      <EntityColumns
        entityGroups={entityGroups}
        columnWidth={300}
        scrollContainerRef={createRef()}
        onScroll={noop}
        newCards={new Set()}
        removingCardSpacer={null}
        spacerShrinking={false}
        browserOpenAtPosition={null}
        editingAdversaryId={null}
        handleSaveCustomAdversary={noop}
        handleCancelEdit={noop}
        updateAdversary={noop}
        updateEnvironment={noop}
        adversaries={[]}
        handleEditAdversary={noop}
        createAdversary={noop}
        createAdversariesBulk={noop}
        pcCount={4}
        smoothScrollTo={noop}
        getEntityGroups={() => entityGroups}
        deleteAdversary={noop}
        deleteEnvironment={noop}
        setRemovingCardSpacer={noop}
        setSpacerShrinking={noop}
      />
    )

    const wrappers = container.querySelectorAll('[data-group-wrapper]')
    expect(wrappers.length).toBe(2)

    wrappers.forEach((wrapper) => {
      const stickyLeftEdge = wrapper.querySelector('div[style*="position: sticky"][style*="left: 0"]')
      expect(stickyLeftEdge).toBeTruthy()
      // Must not carry a right/width that would make it double as the full rail —
      // it should be a hairline pinned to the left, independent of the pill.
      expect(stickyLeftEdge.style.width).toBe('0px')
    })
  })
})

// #96: colossus cards never get add/remove instance buttons, in either
// display mode, regardless of whether the adversary browser panel is open
// (browserOpenAtPosition is what normally gates showAddRemoveButtons/
// onAddInstance/onRemoveInstance for regular adversaries).
describe('EntityColumns colossus add/remove suppression (#96)', () => {
  const baseProps = {
    columnWidth: 300,
    scrollContainerRef: createRef(),
    onScroll: noop,
    newCards: new Set(),
    removingCardSpacer: null,
    spacerShrinking: false,
    editingAdversaryId: null,
    handleSaveCustomAdversary: noop,
    handleCancelEdit: noop,
    updateAdversary: noop,
    updateEnvironment: noop,
    adversaries: [],
    handleEditAdversary: noop,
    createAdversary: noop,
    createAdversariesBulk: noop,
    pcCount: 4,
    smoothScrollTo: noop,
    deleteAdversary: noop,
    deleteEnvironment: noop,
    setRemovingCardSpacer: noop,
    setSpacerShrinking: noop,
  }

  const colossusInstance = { id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true, segmentHp: { seg1: 0 } }
  const colossusTemplate = { baseName: 'Ikeri', isColossus: true, segments: [{ id: 'seg1', name: 'Head', hp: 5 }] }

  it('nested mode: suppresses add/remove props even with the browser panel open', () => {
    const nestedGroup = {
      type: 'adversary',
      baseName: 'Ikeri',
      template: colossusTemplate,
      instances: [colossusInstance],
    }
    const entityGroups = [nestedGroup]

    render(
      <EntityColumns
        {...baseProps}
        entityGroups={entityGroups}
        browserOpenAtPosition={0}
        getEntityGroups={() => entityGroups}
      />
    )

    const props = GameCard.mock.calls.at(-1)[0]
    expect(props.showAddRemoveButtons).toBe(false)
    expect(props.onAddInstance).toBeUndefined()
    expect(props.onRemoveInstance).toBeUndefined()
  })

  it('segments mode: suppresses add/remove props on each segment pseudo-group even with the browser panel open', () => {
    const segmentGroup = {
      type: 'adversary',
      baseName: 'Ikeri::seg1',
      template: colossusTemplate,
      instances: [colossusInstance],
      groupName: 'colossus: ikeri',
      isColossusSegment: true,
      segment: colossusTemplate.segments[0],
      segmentKey: 'seg1',
      colossusInstanceId: colossusInstance.id,
    }
    const entityGroups = [segmentGroup]

    render(
      <EntityColumns
        {...baseProps}
        entityGroups={entityGroups}
        browserOpenAtPosition={0}
        getEntityGroups={() => entityGroups}
      />
    )

    const props = GameCard.mock.calls.at(-1)[0]
    expect(props.showAddRemoveButtons).toBe(false)
    expect(props.onAddInstance).toBeUndefined()
    expect(props.onRemoveInstance).toBeUndefined()
  })
})

// #108: colossus segment pseudo-groups synthesize a unique `baseName` (e.g.
// "Ikeri::seg1") so segment cards stay visually adjacent under grouping — but
// the card itself must still display the plain colossus name, not that key.
describe('EntityColumns colossus segment card name (#108)', () => {
  const baseProps = {
    columnWidth: 300,
    scrollContainerRef: createRef(),
    onScroll: noop,
    newCards: new Set(),
    removingCardSpacer: null,
    spacerShrinking: false,
    editingAdversaryId: null,
    handleSaveCustomAdversary: noop,
    handleCancelEdit: noop,
    updateAdversary: noop,
    updateEnvironment: noop,
    adversaries: [],
    handleEditAdversary: noop,
    createAdversary: noop,
    createAdversariesBulk: noop,
    pcCount: 4,
    smoothScrollTo: noop,
    deleteAdversary: noop,
    deleteEnvironment: noop,
    setRemovingCardSpacer: noop,
    setSpacerShrinking: noop,
  }

  const colossusInstance = { id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true, segmentHp: { seg1: 0 } }
  const colossusTemplate = { baseName: 'Ikeri', isColossus: true, segments: [{ id: 'seg1', name: 'Head', hp: 5 }] }

  it('passes the plain colossus name to GameCard, not the synthetic segment baseName', () => {
    const segmentGroup = {
      type: 'adversary',
      baseName: 'Ikeri::seg1',
      template: colossusTemplate,
      instances: [colossusInstance],
      groupName: 'colossus: ikeri',
      isColossusSegment: true,
      segment: colossusTemplate.segments[0],
      segmentKey: 'seg1',
      colossusInstanceId: colossusInstance.id,
    }
    const entityGroups = [segmentGroup]

    render(
      <EntityColumns
        {...baseProps}
        entityGroups={entityGroups}
        browserOpenAtPosition={null}
        getEntityGroups={() => entityGroups}
      />
    )

    const props = GameCard.mock.calls.at(-1)[0]
    expect(props.item.name).toBe('Ikeri')
    expect(props.item.name).not.toContain('::')
  })
})

// #79: on narrow/mobile viewports, a multi-entry group section (e.g. colossus
// segments, one pseudo-group per segment sharing a groupName) must not grow
// past columnWidth. Without the isNarrow cap, the group-wrapper's cards row
// sizes to its natural width (entries * columnWidth), which broke the
// single-column mobile layout and let segment cards render far wider than
// the viewport.
describe('EntityColumns narrow-mode group width cap (#79)', () => {
  const group = (baseName) => ({
    type: 'adversary',
    baseName,
    groupName: 'colossus: daktadae',
    template: { baseName: 'Daktadae', isColossus: true },
    instances: [{ id: `${baseName}-1`, duplicateNumber: 1, hp: 0, stress: 0, isVisible: true }],
    isColossusSegment: true,
  })

  const baseProps = {
    scrollContainerRef: createRef(),
    onScroll: noop,
    newCards: new Set(),
    removingCardSpacer: null,
    spacerShrinking: false,
    browserOpenAtPosition: null,
    editingAdversaryId: null,
    handleSaveCustomAdversary: noop,
    handleCancelEdit: noop,
    updateAdversary: noop,
    updateEnvironment: noop,
    adversaries: [],
    handleEditAdversary: noop,
    createAdversary: noop,
    createAdversariesBulk: noop,
    pcCount: 4,
    smoothScrollTo: noop,
    deleteAdversary: noop,
    deleteEnvironment: noop,
    setRemovingCardSpacer: noop,
    setSpacerShrinking: noop,
  }

  it('caps the group-wrapper width to columnWidth when isNarrow is true', () => {
    const entityGroups = [group('Head'), group('Torso'), group('Foreleg')]

    const { container } = render(
      <EntityColumns
        {...baseProps}
        entityGroups={entityGroups}
        getEntityGroups={() => entityGroups}
        columnWidth={355}
        isNarrow
      />
    )

    const wrapper = container.querySelector('[data-group-wrapper]')
    expect(wrapper.style.width).toBe('355px')
  })

  it('leaves the group-wrapper width unconstrained when isNarrow is false', () => {
    const entityGroups = [group('Head'), group('Torso'), group('Foreleg')]

    const { container } = render(
      <EntityColumns
        {...baseProps}
        entityGroups={entityGroups}
        getEntityGroups={() => entityGroups}
        columnWidth={355}
        isNarrow={false}
      />
    )

    const wrapper = container.querySelector('[data-group-wrapper]')
    expect(wrapper.style.width).toBe('')
  })
})

// #109: group.template.colossusStressMax (set at creation time in
// useAdversaryState.js) must survive onto `item` unchanged — `item.hp`/
// `item.stress` are zeroed above for the (unrelated) adversary-instance-fields
// convention, so the framework stress-track length needs its own key.
describe('EntityColumns preserves colossus stress track length (#109)', () => {
  const baseProps = {
    columnWidth: 300,
    scrollContainerRef: createRef(),
    onScroll: noop,
    newCards: new Set(),
    removingCardSpacer: null,
    spacerShrinking: false,
    editingAdversaryId: null,
    handleSaveCustomAdversary: noop,
    handleCancelEdit: noop,
    updateAdversary: noop,
    updateEnvironment: noop,
    adversaries: [],
    handleEditAdversary: noop,
    createAdversary: noop,
    createAdversariesBulk: noop,
    pcCount: 4,
    smoothScrollTo: noop,
    deleteAdversary: noop,
    deleteEnvironment: noop,
    setRemovingCardSpacer: noop,
    setSpacerShrinking: noop,
  }

  it('exposes the colossus stress track length as item.colossusStressMax, not the zeroed item.stress', () => {
    const colossusInstance = { id: 'adv-1', duplicateNumber: 1, hp: 0, stress: 2, isVisible: true }
    const colossusTemplate = { baseName: 'Ikeri', isColossus: true, colossusStressMax: 6, segments: [] }
    const nestedGroup = {
      type: 'adversary',
      baseName: 'Ikeri',
      template: colossusTemplate,
      instances: [colossusInstance],
    }
    const entityGroups = [nestedGroup]

    render(
      <EntityColumns
        {...baseProps}
        entityGroups={entityGroups}
        browserOpenAtPosition={null}
        getEntityGroups={() => entityGroups}
      />
    )

    const props = GameCard.mock.calls.at(-1)[0]
    expect(props.item.colossusStressMax).toBe(6)
    expect(props.item.stress).toBe(0)
  })
})
