import React from 'react'
import ReorderControls from './ReorderControls'
import { CARD_SPACE_H, CARD_SPACE_V, CARD_INDENT } from './constants'
import { highlightCardText } from './textHighlighter'
import SectionHeader from './SectionHeader'

// Shared with environment and colossus cards (#100/#109) — see SectionHeader.jsx.
const FeatureDivider = SectionHeader

const FeaturesSection = ({ item, isEditMode, onUpdate, handleFeatureDeleteClick, deleteConfirmations, getFeatureKey }) => {
  const hasStandardAttack = isEditMode || (item.atk !== undefined && item.weapon)
  const hasFeatures = (item.features && item.features.length > 0) || isEditMode
  
  if (!hasStandardAttack && !hasFeatures) return null

  const renderFeatureEditor = (feature, placeholder, type, featureIndex) => (
    <div
      key={feature.id || `${type}-${featureIndex}`}
      style={{
        display: 'flex',
        gap: CARD_SPACE_H,
        padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
        border: '1px solid var(--border)',
        borderRadius: '0.25rem',
        backgroundColor: 'var(--bg-secondary)',
        alignItems: 'stretch',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
        <input
          type="text"
          value={feature.name || ''}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-lpignore="true"
          data-form-type="other"
          name={`feature-name-${type.toLowerCase()}`}
          onChange={(e) => {
            const newFeatures = [...(item.features || [])]
            const featureIndex = newFeatures.findIndex((f) => f.type === type && f === feature)
            if (featureIndex >= 0) {
              newFeatures[featureIndex] = { ...newFeatures[featureIndex], name: e.target.value }
            } else {
              newFeatures.push({ type, name: e.target.value, description: feature.description || '' })
            }

            const typeFeatures = newFeatures.filter((f) => f.type === type)
            const lastFeature = typeFeatures[typeFeatures.length - 1]
            if (lastFeature && lastFeature.name.trim()) {
              newFeatures.push({ type, name: '', description: '' })
            }

            onUpdate && onUpdate(item.id, { features: newFeatures })
          }}
          placeholder={`${placeholder} name`}
          style={{
            padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
            border: '1px solid var(--border)',
            borderRadius: '0.25rem',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            transition: 'background-color 0.2s',
          }}
        />
        <textarea
          value={feature.description || ''}
          onChange={(e) => {
            const newFeatures = [...(item.features || [])]
            const featureIndex = newFeatures.findIndex((f) => f.type === type && f === feature)
            if (featureIndex >= 0) {
              newFeatures[featureIndex] = { ...newFeatures[featureIndex], description: e.target.value }
            } else {
              newFeatures.push({ type, name: feature.name || '', description: e.target.value })
            }

            const typeFeatures = newFeatures.filter((f) => f.type === type)
            const lastFeature = typeFeatures[typeFeatures.length - 1]
            if (lastFeature && lastFeature.name.trim()) {
              newFeatures.push({ type, name: '', description: '' })
            }

            onUpdate && onUpdate(item.id, { features: newFeatures })
          }}
          placeholder={`${placeholder} description`}
          style={{
            padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
            border: '1px solid var(--border)',
            borderRadius: '0.25rem',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            minHeight: '4.5rem',
            resize: 'vertical',
          }}
        />
      </div>
      <ReorderControls
        feature={feature}
        featureType={type}
        item={item}
        onUpdate={onUpdate}
        handleFeatureDeleteClick={handleFeatureDeleteClick}
        deleteConfirmations={deleteConfirmations}
        getFeatureKey={getFeatureKey}
      />
    </div>
  )

  const renderFeatureList = (features, placeholder) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
      {features.map((feature, index) => (
        <div key={`${feature.type}-${index}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 400, color: 'var(--text-primary)', fontSize: '0.85rem', textDecoration: 'underline' }}>{feature.name}</span>
          </div>
          <div style={{ 
            fontSize: '0.85rem', 
            lineHeight: 1.4, 
            color: 'var(--text-secondary)',
            marginLeft: CARD_INDENT,
          }}>
            {feature.description ? highlightCardText(feature.description) : placeholder}
          </div>
        </div>
      ))}
    </div>
  )

  const renderStandardAttack = () => {
    if (!isEditMode) return null

    return (
      <div>
        <FeatureDivider title="Standard Attack" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: CARD_SPACE_V,
              padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', gap: CARD_SPACE_H, alignItems: 'center' }}>
              <input
                type="text"
                value={item.weapon || ''}
                onChange={(e) => onUpdate && onUpdate(item.id, { weapon: e.target.value })}
                placeholder="Standard attack name"
                style={{
                  flex: 1,
                  padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
                  border: '1px solid var(--border)',
                  borderRadius: '0.25rem',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
              <select
                value={item.range || ''}
                onChange={(e) => onUpdate && onUpdate(item.id, { range: e.target.value })}
                style={{
                  flex: 1,
                  padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
                  border: '1px solid var(--border)',
                  borderRadius: '0.25rem',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  appearance: 'none',
                  backgroundImage:
                    "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1rem',
                  paddingRight: '2rem',
                }}
              >
                <option value=""></option>
                <option value="Melee">Melee</option>
                <option value="Very Close">Very Close</option>
                <option value="Close">Close</option>
                <option value="Far">Far</option>
                <option value="Very Far">Very Far</option>
              </select>
              <input
                type="text"
                value={item.damage || ''}
                onChange={(e) => onUpdate && onUpdate(item.id, { damage: e.target.value })}
                placeholder="Damage (e.g., 1d6+2)"
                style={{
                  flex: 1,
                  padding: `${CARD_SPACE_V} ${CARD_SPACE_H}`,
                  border: '1px solid var(--border)',
                  borderRadius: '0.25rem',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderFeatureCategory = (type, title) => {
    const features = (item.features || []).filter((f) => f.type === type)
    const hasCategoryFeatures = features.length > 0

    if (!hasCategoryFeatures && !isEditMode) return null

    const featuresToShow = isEditMode && features.length === 0 ? [{ type, name: '', description: '' }] : features

    return (
      <div style={{ marginTop: CARD_SPACE_V }}>
        <FeatureDivider title={title} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: CARD_SPACE_V }}>
          {isEditMode
            ? featuresToShow.map((feature, featureIndex) => renderFeatureEditor(feature, title.slice(0, -1), type, featureIndex))
            : (hasCategoryFeatures ? renderFeatureList(featuresToShow, `Describe the ${title.toLowerCase()}`) : null)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      paddingLeft: CARD_SPACE_H,
      paddingRight: CARD_SPACE_H,
    }}>
      {renderStandardAttack()}
      {renderFeatureCategory('Action', 'Actions')}
      {renderFeatureCategory('Passive', 'Passives')}
      {renderFeatureCategory('Reaction', 'Reactions')}
    </div>
  )
}

export default FeaturesSection

