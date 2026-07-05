import React from 'react'
import { CARD_SPACE_H, CARD_SPACE_V } from './constants'
import { ExperienceTags } from './MotivesExperience'

const ExperienceSection = ({ item, isEditMode, onUpdate, deleteConfirmations, setDeleteConfirmations }) => {
  const getExperienceKey = (exp, index) => {
    return `experience-${index}-${typeof exp === 'string' ? exp : exp.name || 'blank'}`
  }

  const filterBlankExperiences = (experiences) => {
    if (!Array.isArray(experiences)) return []
    return experiences.filter((exp) => {
      if (typeof exp === 'string') {
        return exp.trim().length > 0
      }
      const name = exp.name || ''
      const modifier = exp.modifier || 0
      return name.trim().length > 0 || modifier > 0
    })
  }

  const handleExperienceDeleteClick = (expToDelete, index) => {
    const experienceKey = getExperienceKey(expToDelete, index)

    if (deleteConfirmations[experienceKey]) {
      const newExp = [...(item.experience || [])]
      newExp.splice(index, 1)
      const filteredExp = filterBlankExperiences(newExp)
      onUpdate && onUpdate(item.id, { experience: filteredExp })

      setDeleteConfirmations((prev) => {
        const newState = { ...prev }
        delete newState[experienceKey]
        return newState
      })
    } else {
      setDeleteConfirmations((prev) => ({
        ...prev,
        [experienceKey]: true
      }))

      setTimeout(() => {
        setDeleteConfirmations((prev) => {
          const newState = { ...prev }
          delete newState[experienceKey]
          return newState
        })
      }, 3000)
    }
  }

  const renderEditExperiences = () => {
    const experiences = item.experience || []
    const experiencesToShow = experiences.length === 0 ? [{ name: '', modifier: 0 }] : experiences

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
        {experiencesToShow.map((exp, index) => (
          <div key={index} style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '1px',
                width: '24px',
                height: '24px'
              }}
            >
              <input
                type="text"
                value={typeof exp === 'object' ? (exp.modifier > 0 ? `+${exp.modifier}` : '') : ''}
                onChange={(e) => {
                  const newExp = [...(item.experience || [])]
                  const modifierValue = e.target.value.replace(/[^0-9+-]/g, '')
                  const modifier = modifierValue === '' || modifierValue === '+' ? 0 : parseInt(modifierValue) || 0
                  const clampedModifier = Math.max(0, modifier)
                  newExp[index] = { name: typeof exp === 'string' ? exp : exp.name || '', modifier: clampedModifier }
                  const filteredExp = filterBlankExperiences(newExp)
                  onUpdate && onUpdate(item.id, { experience: filteredExp })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    const newExp = [...(item.experience || [])]
                    const currentModifier = typeof exp === 'object' ? exp.modifier || 0 : 0
                    const delta = e.key === 'ArrowUp' ? 1 : -1
                    newExp[index] = {
                      name: typeof exp === 'string' ? exp : exp.name || '',
                      modifier: Math.max(0, currentModifier + delta)
                    }
                    const filteredExp = filterBlankExperiences(newExp)
                    onUpdate && onUpdate(item.id, { experience: filteredExp })
                  }
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  border: '1px solid var(--text-secondary)',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: '1px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginLeft: '32px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={typeof exp === 'string' ? exp : exp.name || ''}
                onChange={(e) => {
                  const newExp = [...(item.experience || [])]
                  const currentModifier = typeof exp === 'object' ? exp.modifier || 0 : 0
                  newExp[index] = { name: e.target.value, modifier: currentModifier }

                  let filteredExp = filterBlankExperiences(newExp)
                  const lastExperience = filteredExp[filteredExp.length - 1]
                  if (lastExperience && (typeof lastExperience === 'string' ? lastExperience.trim() : lastExperience.name?.trim())) {
                    filteredExp = [...filteredExp, { name: '', modifier: 0 }]
                  }

                  onUpdate && onUpdate(item.id, { experience: filteredExp })
                }}
                placeholder="Experience name"
                style={{
                  flex: 1,
                  padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  transition: 'background-color 0.2s'
                }}
              />

              <div style={{ display: 'flex', gap: '0.125rem' }}>
                <button
                  onClick={() => {
                    const newExp = [...(item.experience || [])]
                    const currentExpName = typeof exp === 'string' ? exp.trim() : exp.name?.trim()
                    const prevExp = newExp[index - 1]
                    const prevExpName = typeof prevExp === 'string' ? prevExp?.trim() : prevExp?.name?.trim()

                    if (index > 0 && index < newExp.length && currentExpName && prevExpName) {
                      newExp[index] = prevExp
                      newExp[index - 1] = exp
                      const filteredExp = filterBlankExperiences(newExp)
                      onUpdate && onUpdate(item.id, { experience: filteredExp })
                    }
                  }}
                  disabled={
                    index === 0 ||
                    !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                    !(
                      typeof experiencesToShow[index - 1] === 'string'
                        ? experiencesToShow[index - 1].trim()
                        : experiencesToShow[index - 1]?.name?.trim()
                    )
                  }
                  style={{
                    width: '22px',
                    height: '22px',
                    padding: '0',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    backgroundColor:
                      index === 0 ||
                      !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                      !(
                        typeof experiencesToShow[index - 1] === 'string'
                          ? experiencesToShow[index - 1].trim()
                          : experiencesToShow[index - 1]?.name?.trim()
                      )
                        ? 'var(--gray-800)'
                        : 'var(--gray-700)',
                    color:
                      index === 0 ||
                      !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                      !(
                        typeof experiencesToShow[index - 1] === 'string'
                          ? experiencesToShow[index - 1].trim()
                          : experiencesToShow[index - 1]?.name?.trim()
                      )
                        ? 'var(--text-secondary)'
                        : 'white',
                    cursor:
                      index === 0 ||
                      !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                      !(
                        typeof experiencesToShow[index - 1] === 'string'
                          ? experiencesToShow[index - 1].trim()
                          : experiencesToShow[index - 1]?.name?.trim()
                      )
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      index === 0 ||
                      !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                      !(
                        typeof experiencesToShow[index - 1] === 'string'
                          ? experiencesToShow[index - 1].trim()
                          : experiencesToShow[index - 1]?.name?.trim()
                      )
                        ? 0.5
                        : 1,
                    fontWeight: '600',
                    fontSize: '12px',
                    lineHeight: '1',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Move up"
                >
                  ↑
                </button>

                <button
                  onClick={() => {
                    const newExp = [...(item.experience || [])]
                    const currentExpName = typeof exp === 'string' ? exp.trim() : exp.name?.trim()
                    const nextExp = newExp[index + 1]
                    const nextExpName = typeof nextExp === 'string' ? nextExp?.trim() : nextExp?.name?.trim()

                    if (index < newExp.length - 1 && index >= 0 && currentExpName && nextExpName) {
                      newExp[index] = nextExp
                      newExp[index + 1] = exp
                      const filteredExp = filterBlankExperiences(newExp)
                      onUpdate && onUpdate(item.id, { experience: filteredExp })
                    }
                  }}
                  disabled={
                    index === experiencesToShow.length - 1 ||
                    !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                    !(
                      typeof experiencesToShow[index + 1] === 'string'
                        ? experiencesToShow[index + 1].trim()
                        : experiencesToShow[index + 1]?.name?.trim()
                    )
                  }
                  style={{
                    width: '22px',
                    height: '22px',
                    padding: '0',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    backgroundColor:
                      index === experiencesToShow.length - 1 ||
                      !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                      !(
                        typeof experiencesToShow[index + 1] === 'string'
                          ? experiencesToShow[index + 1].trim()
                          : experiencesToShow[index + 1]?.name?.trim()
                      )
                        ? 'var(--gray-800)'
                        : 'var(--gray-700)',
                    color:
                      index === experiencesToShow.length - 1 ||
                      !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                      !(
                        typeof experiencesToShow[index + 1] === 'string'
                          ? experiencesToShow[index + 1].trim()
                          : experiencesToShow[index + 1]?.name?.trim()
                      )
                        ? 'var(--text-secondary)'
                        : 'white',
                    cursor:
                      index === experiencesToShow.length - 1 ||
                      !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                      !(
                        typeof experiencesToShow[index + 1] === 'string'
                          ? experiencesToShow[index + 1].trim()
                          : experiencesToShow[index + 1]?.name?.trim()
                      )
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      index === experiencesToShow.length - 1 ||
                      !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ||
                      !(
                        typeof experiencesToShow[index + 1] === 'string'
                          ? experiencesToShow[index + 1].trim()
                          : experiencesToShow[index + 1]?.name?.trim()
                      )
                        ? 0.5
                        : 1,
                    fontWeight: '600',
                    fontSize: '12px',
                    lineHeight: '1',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Move down"
                >
                  ↓
                </button>

                <button
                  onClick={() => handleExperienceDeleteClick(exp, index)}
                  disabled={!(typeof exp === 'string' ? exp.trim() : exp.name?.trim())}
                  style={{
                    width: '22px',
                    height: '22px',
                    padding: '0',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    backgroundColor: deleteConfirmations[getExperienceKey(exp, index)]
                      ? 'var(--danger)'
                      : !(typeof exp === 'string' ? exp.trim() : exp.name?.trim())
                      ? 'var(--gray-800)'
                      : 'var(--gray-700)',
                    color: !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ? 'var(--text-secondary)' : 'white',
                    cursor: !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ? 'not-allowed' : 'pointer',
                    opacity: !(typeof exp === 'string' ? exp.trim() : exp.name?.trim()) ? 0.5 : 1,
                    fontWeight: '600',
                    fontSize: '12px',
                    lineHeight: '1',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={
                    deleteConfirmations[getExperienceKey(exp, index)] ? 'Click again to confirm delete' : 'Delete experience'
                  }
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Shared with colossus cards (#109) — see MotivesExperience.jsx.
  const renderReadOnlyExperiences = () => <ExperienceTags experience={item.experience} />

  return (
    <div style={{ paddingTop: '0' }}>
      {isEditMode ? renderEditExperiences() : <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>{renderReadOnlyExperiences()}</div>}
    </div>
  )
}

export default ExperienceSection

