import React from 'react'

const Panel = ({
  side = 'left', // 'left' or 'right'
  children,
  className = '',
  style = {},
  dataCardKey
}) => {
  const isLeft = side === 'left'

  const baseStyle = {
    flex: 1,
    minWidth: 0,
    background: 'transparent',
    overflowY: 'auto',
    overflowX: isLeft ? 'auto' : 'hidden', // Right panel prevents horizontal spill
    display: isLeft ? 'block' : 'flex',
    flexDirection: isLeft ? 'initial' : 'column',
    height: '100%',
    padding: isLeft ? '8px 0 8px 0' : '0 8px 0 0', // Keep horizontal padding off to match layout math
    ...style
  }

  return (
    <div
      className={className}
      style={baseStyle}
      data-card-key={dataCardKey}
    >
      {children}
    </div>
  )
}

export default Panel
