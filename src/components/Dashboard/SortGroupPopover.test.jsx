import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import SortGroupPopover from './SortGroupPopover'

describe('SortGroupPopover group options (#106: "none" removed)', () => {
  it('does not offer a "None" grouping option — grouping is always on', () => {
    const anchorRef = createRef()
    render(
      <SortGroupPopover
        anchorRef={anchorRef}
        placement="right"
        sortBy="name"
        sortDir="asc"
        groupBy="type"
        onSortBy={() => {}}
        onGroupBy={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.queryByText('None')).toBeNull()
    // Both "Type" and "Tier" appear twice (once under Sort by, once under Group by)
    expect(screen.getAllByText('Type')).toHaveLength(2)
    expect(screen.getAllByText('Tier')).toHaveLength(2)
  })
})
