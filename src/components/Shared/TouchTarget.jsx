import React from 'react'

// Expands the *clickable* area of a small/dense control to the WCAG/iOS
// 44x44px minimum without growing its *visual* footprint — used across
// GameCard quick-edit icon buttons, StatField steppers, and other tightly
// clustered controls where visually growing the element would break an
// established compact layout (#30 mobile touch-target audit).
//
// The interactive element itself must be sized to the full hit area — an
// absolutely-positioned child that visually overflows its parent does NOT
// expand a button's click hit-testing box in the browser. So this renders
// a button sized to `size` (min 44px, default 44) with a negative margin
// equal to the overflow beyond `visualSize`, which pulls the extra hit
// area back over surrounding content instead of pushing neighbors apart.
// The visible child renders at its own small size, centered; neighboring
// elements keep their original gaps.
//
// `visualSize` should match the pixel width/height of the visible control
// passed as `style` (defaults to 24, this app's common compact icon-button
// size). Pass it explicitly if the visual control isn't square or isn't 24px.
const TouchTarget = ({
  as: Tag = 'button',
  size = 44,
  visualSize = 24,
  wrapperStyle = {},
  style = {},
  children,
  ...rest
}) => {
  const overflow = Math.max(0, (size - visualSize) / 2)

  return (
    <Tag
      {...rest}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        margin: `${-overflow}px`,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        flexShrink: 0,
        ...wrapperStyle,
      }}
    >
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        {children}
      </span>
    </Tag>
  )
}

export default TouchTarget
