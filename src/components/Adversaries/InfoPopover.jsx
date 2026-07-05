import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'

// Hover-style info popover used across the custom adversary creator form.
// Extracted verbatim from CustomAdversaryCreator.jsx (Phase 4).
// align: 'left' anchors popover to the left edge of the trigger (default)
//        'right' anchors to the right edge — use for fields near the right of the form
//
// #123 (2026-07-05 playtest): the trigger used to be a separate circular "i"
// icon button sitting next to the plain label text. That icon ate horizontal
// space labels needed to avoid wrapping, so the trigger is now the label
// text itself — rendered with a dashed underline — and `label` replaces the
// plain <span>{label}</span> call sites used to render next to the icon.
export const InfoPopover = ({ children, label, align = 'left', minWidth = 220 }) => {
  const [open, setOpen] = useState(false)
  const [adjust, setAdjust] = useState({ dx: 0, flipUp: false })
  const containerRef = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler) }
  }, [open])

  useLayoutEffect(() => {
    if (!open || !popoverRef.current) { setAdjust({ dx: 0, flipUp: false }); return }
    const rect = popoverRef.current.getBoundingClientRect()
    const MARGIN = 8
    // Use the nearest scrollable ancestor's visible area as the clip boundary,
    // falling back to the viewport if none is found.
    let clipBottom = window.innerHeight
    let clipRight  = window.innerWidth
    let clipLeft   = 0
    let el = containerRef.current?.parentElement
    while (el && el !== document.body) {
      const s = getComputedStyle(el)
      if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        const cr = el.getBoundingClientRect()
        clipBottom = cr.bottom
        clipRight  = cr.right
        clipLeft   = cr.left
        break
      }
      el = el.parentElement
    }
    let dx = 0
    if (rect.right > clipRight - MARGIN)  dx = clipRight  - MARGIN - rect.right
    if (rect.left + dx < clipLeft + MARGIN) dx = clipLeft + MARGIN - rect.left
    const flipUp = rect.bottom > clipBottom - MARGIN
    setAdjust({ dx, flipUp })
  }, [open])

  const hAlign = align === 'right' ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' }
  const vAlign = adjust.flipUp ? { bottom: '36px', top: 'auto' } : { top: '36px', bottom: 'auto' }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        style={{
          border: 'none', background: 'transparent',
          cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center',
          minHeight: '44px',
          font: 'inherit', textAlign: 'left',
          color: open ? 'var(--purple)' : 'var(--text-secondary)',
          textDecoration: 'underline',
          textDecorationStyle: 'dashed',
          textDecorationColor: open ? 'var(--purple)' : 'var(--border)',
          textUnderlineOffset: '3px',
        }}
      >
        {label}
      </button>
      {open && (
        <div ref={popoverRef} style={{
          position: 'absolute', ...hAlign, ...vAlign,
          minWidth: `${minWidth}px`, maxWidth: `${Math.max(minWidth, 320)}px`,
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          zIndex: 200,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--text-secondary)',
          transform: adjust.dx ? `translateX(${adjust.dx}px)` : 'none',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default InfoPopover
