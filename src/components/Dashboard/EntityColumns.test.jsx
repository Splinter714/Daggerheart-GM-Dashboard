import { render } from '@testing-library/react'
import { createRef } from 'react'
import EntityColumns from './EntityColumns'

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
