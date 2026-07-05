import React from 'react'

/**
 * Brief "<Name> added" confirmation for mobile, where the browser panel
 * covers the whole screen and there's otherwise no feedback that adding an
 * adversary did anything (see #36). Desktop doesn't need this since the
 * dashboard stays visible behind the panel.
 */
const AdversaryToast = ({ message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        transform: 'translateX(-50%)',
        zIndex: 200,
        pointerEvents: 'none',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '999px',
        padding: '0.5rem 1rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        color: 'var(--text-primary)',
        fontSize: '0.85rem',
        fontWeight: 600,
        opacity: message ? 1 : 0,
        transition: 'opacity 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  )
}

export default AdversaryToast
