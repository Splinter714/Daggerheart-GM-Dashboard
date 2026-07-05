import React from 'react'
import { Skull, TreePine, Plus, WandSparkles, Settings, ClipboardList, Dices } from 'lucide-react'
import { DASHBOARD_GAP } from './constants'

const RAIL_SIZE = 60

const BadgeIcon = ({ Base, size = 26, strokeWidth = 1.6, baseStyle }) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
    <span style={baseStyle}>
      <Base size={size} strokeWidth={strokeWidth} />
    </span>
    <Plus
      size={13}
      strokeWidth={2.8}
      style={{
        position: 'absolute',
        bottom: -2,
        right: -4,
        background: 'var(--bg-primary)',
        borderRadius: '50%',
        padding: 1,
      }}
    />
  </span>
)

const SkullPlus    = (props) => <BadgeIcon Base={Skull}    {...props} />
const TreePinePlus = (props) => <BadgeIcon Base={TreePine} {...props} baseStyle={{ transform: 'scaleX(0.9)', display: 'inline-flex' }} />

const NAV_ITEMS = [
  { id: 'browse-env', Icon: TreePinePlus,  label: 'Add environments' },
  { id: 'browse',     Icon: SkullPlus,     label: 'Add adversaries'  },
  { id: 'create',     Icon: WandSparkles,  label: 'Create custom'    },
  { id: 'receipt',    Icon: ClipboardList, label: 'Encounter info'   },
]

const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
              window.navigator.standalone === true ||
              document.referrer.includes('android-app://')

const NavRail = ({ placement = 'right', activeId, onAction }) => {
  const isRight = placement === 'right'

  const renderButton = ({ id, Icon, label, active, onClick }) => (
    <button
      key={id}
      type="button"
      title={label}
      onClick={onClick}
      style={{
        width: isRight ? `${RAIL_SIZE - 8}px` : '52px',
        height: isRight ? '44px' : `${RAIL_SIZE - 8}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'color-mix(in srgb, var(--purple) 15%, transparent)' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: active ? 'var(--purple)' : 'var(--text-secondary)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'color 0.15s, background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = active ? 'var(--purple)' : 'var(--text-secondary)' }}
    >
      <Icon size={26} strokeWidth={1.6} />
    </button>
  )

  const buttons = (
    <>
      {NAV_ITEMS.map(({ id, Icon, label }) => {
        const active = activeId === id
        return renderButton({ id, Icon, label, active, onClick: () => onAction(id) })
      })}
      {renderButton({
        id: 'info',
        Icon: Settings,
        label: 'Settings',
        active: activeId === 'info',
        onClick: () => onAction('info'),
      })}
    </>
  )

  if (isRight) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: `${RAIL_SIZE}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '0.5rem',
        borderLeft: '1px solid var(--border)',
        paddingTop: '3.5rem',
        paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)',
        backgroundColor: 'var(--bg-primary)',
        zIndex: 100,
      }}>
        {buttons}
      </div>
    )
  }

  // Bottom placement: mobile nav — dashboard button is leftmost
  return (
    <div style={{
      position: 'fixed',
      left: 0, right: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      borderTop: '1px solid var(--border)',
      backgroundColor: 'var(--bg-primary)',
      zIndex: 100,
    }}>
      <div style={{
        height: `${RAIL_SIZE}px`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingLeft: 'env(safe-area-inset-left, 0)',
        paddingRight: 'env(safe-area-inset-right, 0)',
      }}>
        {/* Dashboard button — mobile only, always leftmost */}
        {renderButton({
          id: 'dashboard',
          Icon: Dices,
          label: 'View dashboard',
          active: activeId === null,
          onClick: () => onAction('dashboard'),
        })}
        {buttons}
      </div>
      {isPWA && <div aria-hidden="true" style={{ height: '2rem', flexShrink: 0 }} />}
    </div>
  )
}

export default NavRail
export { RAIL_SIZE, isPWA }
