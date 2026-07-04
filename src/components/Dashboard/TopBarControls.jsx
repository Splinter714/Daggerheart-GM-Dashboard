import React from 'react'
import { Plus } from 'lucide-react'
import Pips from '../Shared/Pips'
import Bar from './Toolbars'

const TopBarControls = ({ fearValue, onUpdateFear, onToggleBrowser, isBrowserOpen }) => {
  return (
    <Bar position="top">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          width: '100%',
          justifyContent: 'space-between',
          padding: '0 1rem',
        }}
      >
        {/* FEAR TRACKER TEMPORARILY DISABLED
        <Pips
          type="fear"
          value={fearValue}
          maxValue={12}
          onChange={onUpdateFear}
          showTooltip={false}
          enableBoundaryClick={true}
          clickContainerWidth="100%"
          centerPips={true}
        />
        */}
        <button
          onClick={onToggleBrowser}
          title={isBrowserOpen ? 'Close Browser' : 'Add Adversaries'}
          style={{
            width: '44px',
            height: '44px',
            padding: 0,
            backgroundColor: isBrowserOpen ? 'var(--purple)' : 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            color: isBrowserOpen ? 'white' : 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isBrowserOpen) {
              e.currentTarget.style.borderColor = 'var(--purple)'
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isBrowserOpen) {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <Plus size={18} />
        </button>
      </div>
    </Bar>
  )
}

export default TopBarControls

