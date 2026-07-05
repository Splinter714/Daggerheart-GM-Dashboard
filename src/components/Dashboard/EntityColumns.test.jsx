import { render } from '@testing-library/react'
import { createRef } from 'react'
import EntityColumns from './EntityColumns'
import GameCard from '../Adversaries/GameCard'

vi.mock('../Adversaries/GameCard', () => ({
  default: vi.fn(() => null),
}))

// Covers #86: the grouper rail's left edge must be pinned the same way as the
// group-name pill (position: sticky with an explicit width), not a plain
// absolute box with left:0/right:0 spanning the whole section wrapper —
// otherwise, once the section scrolls partway offscreen, the rail's left
// edge trails behind the pinned pill and peeks out past its left side.
// (An earlier fix split the rail into an absolute top/right box plus a
// separate zero-width sticky hairline for the left edge, but the absolute
// box's own left:0 still tracked the wrapper's scrolled-away edge, so its
// top border kept drawing past the pill — that's the regression Jackson
// saw. Making the whole rail box sticky removes the need for the separate
// hairline.) jsdom doesn't compute real sticky layout, so this test asserts
// the structural fix (a single sticky, explicitly-widthed rail box) rather
// than pixel positions, which the browser-level check in this session
// verified across multiple groups and scroll positions.

const group = (baseName, type) => ({
  type: 'adversary',
  baseName,
  groupName: type,
  template: { baseName, type, hpMax: 5, stressMax: 2 },
  instances: [{ id: `${baseName}-1`, duplicateNumber: 1, hp: 0, stress: 0, isVisible: true }],
})

const noop = () => {}

describe('EntityColumns grouper rail (#86)', () => {
  it('renders the rail as a single sticky, explicitly-widthed box (not absolute with left:0/right:0)', () => {
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
      const railBox = wrapper.querySelector('[data-testid="group-rail-border"]')
      expect(railBox).toBeTruthy()
      // Sticky (not absolute), pinned to the same left:0 edge as the pill.
      expect(railBox.style.position).toBe('sticky')
      expect(railBox.style.left).toBe('0px')
      // Must have an explicit width (not left:0/right:0 auto-stretch, which
      // is how the original regression reintroduced the wrapper-relative
      // left edge) so its size resolves against the wrapper independent of
      // its own sticky offset.
      expect(railBox.style.width).toBe('100%')
      // Draws its own left border now that its left edge is correctly
      // pinned — no separate hairline element needed.
      expect(railBox.style.borderLeft).toBeTruthy()
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

// #55: playtested 2026-07-04 — the "just added" confirmation pulse worked
// for a brand-new card but not when adding another instance to an existing
// card via the open card's own +/- controls (EntityColumns' onAddInstance
// handler, wired through GameCard/TabButtons/StatusSection). Verifies
// onAddInstance also flags the card key in setRecentlyAddedCards.
describe('EntityColumns re-pulses on adding an instance to an existing card (#55)', () => {
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
    createAdversariesBulk: noop,
    pcCount: 4,
    smoothScrollTo: noop,
    deleteAdversary: noop,
    deleteEnvironment: noop,
    setRemovingCardSpacer: noop,
    setSpacerShrinking: noop,
  }

  it('calls setRecentlyAddedCards with the card key when onAddInstance fires', () => {
    const template = { baseName: 'Bear', type: 'Bruiser', hpMax: 5, stressMax: 2 }
    const instance = { id: 'Bear-1', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true }
    const existingGroup = { type: 'adversary', baseName: 'Bear', template, instances: [instance] }
    const entityGroups = [existingGroup]
    const setRecentlyAddedCards = vi.fn()
    const createAdversary = vi.fn()

    render(
      <EntityColumns
        {...baseProps}
        entityGroups={entityGroups}
        browserOpenAtPosition={0}
        getEntityGroups={() => entityGroups}
        createAdversary={createAdversary}
        setRecentlyAddedCards={setRecentlyAddedCards}
      />
    )

    const props = GameCard.mock.calls.at(-1)[0]
    expect(props.onAddInstance).toBeInstanceOf(Function)
    props.onAddInstance(template)

    expect(createAdversary).toHaveBeenCalledWith(template)
    expect(setRecentlyAddedCards).toHaveBeenCalled()
    const updater = setRecentlyAddedCards.mock.calls[0][0]
    const result = updater(new Set())
    expect(result.has('adversary-Bear')).toBe(true)
  })
})

// #30 playtest 2026-07-05: GameCard's quick-edit stepper needs pcCount to display
// and gate Minion add/remove in party-size groups rather than raw instances —
// verify EntityColumns actually forwards it as a prop, since onAddInstance/
// onRemoveInstance already compute isMinion ? pcCount : 1 correctly on their own.
describe('EntityColumns forwards pcCount to GameCard (#30)', () => {
  it('passes the current pcCount through as a GameCard prop', () => {
    const template = { baseName: 'Skulk', type: 'Minion', hpMax: 1, stressMax: 1 }
    const instance = { id: 'Skulk-1', duplicateNumber: 1, hp: 0, stress: 0, isVisible: true }
    const existingGroup = { type: 'adversary', baseName: 'Skulk', template, instances: [instance] }
    const entityGroups = [existingGroup]

    render(
      <EntityColumns
        entityGroups={entityGroups}
        columnWidth={300}
        scrollContainerRef={createRef()}
        onScroll={noop}
        newCards={new Set()}
        removingCardSpacer={null}
        spacerShrinking={false}
        browserOpenAtPosition={0}
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

    const props = GameCard.mock.calls.at(-1)[0]
    expect(props.pcCount).toBe(4)
  })
})
