import React from 'react'
import { Plus, Minus, Pencil, Check, X } from 'lucide-react'

const buttonBaseStyles = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '4px',
  padding: '0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  transition: 'all 0.2s ease'
}

const actionButtonStyles = {
  background: 'var(--purple)',
  border: '1px solid var(--purple)',
  color: 'white',
  borderRadius: '4px',
  padding: '0.375rem 0.75rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
  fontSize: '0.85rem',
  fontWeight: '500',
  transition: 'all 0.2s ease'
}

const GameCardTabButtons = ({
  showCustomCreator,
  onSaveCustomAdversary,
  item,
  onCancelEdit,
  onRemoveInstance,
  onAddInstance,
  instances,
  onEdit
}) => {
  if (showCustomCreator) {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (onSaveCustomAdversary) {
              onSaveCustomAdversary(item, item.id)
              if (onCancelEdit) onCancelEdit()
            }
          }}
          style={actionButtonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          title="Save"
        >
          <Check size={16} />
          <span>Save</span>
        </button>
        {onCancelEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCancelEdit()
            }}
            style={{
              ...actionButtonStyles,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              e.currentTarget.style.borderColor = 'var(--purple)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
            title="Cancel"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemoveInstance && onRemoveInstance(item.id)
        }}
        style={buttonBaseStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          e.currentTarget.style.borderColor = 'var(--purple)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
        title="Remove one"
      >
        <Minus size={16} />
      </button>
      <span
        style={{
          color: 'var(--text-primary)',
          fontSize: '1rem',
          fontWeight: '500',
          minWidth: '24px',
          textAlign: 'center'
        }}
      >
        {instances.length}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onAddInstance && onAddInstance(item)
        }}
        style={buttonBaseStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--purple)'
          e.currentTarget.style.borderColor = 'var(--purple)'
          e.currentTarget.style.color = 'white'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        title="Add another"
      >
        <Plus size={16} />
      </button>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(item.id)
          }}
          style={{ ...buttonBaseStyles, marginLeft: '0.25rem' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--purple)'
            e.currentTarget.style.borderColor = 'var(--purple)'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          title="Edit"
        >
          <Pencil size={16} />
        </button>
      )}
    </>
  )
}

export default GameCardTabButtons

