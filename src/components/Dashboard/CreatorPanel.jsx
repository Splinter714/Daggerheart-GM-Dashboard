import React from 'react'
import { DASHBOARD_GAP, PANEL_BORDER, PANEL_BORDER_RADIUS, PANEL_BOX_SHADOW } from './constants'
import CustomAdversaryCreator from '../Adversaries/CustomAdversaryCreator'
import CustomEnvironmentCreator from '../Environments/CustomEnvironmentCreator'

// Content-type tab bar shown at the top of the creator (#102) — lets a GM
// switch between Adversary and Environment without leaving the creator or
// hunting through nav. Colossus is reached as a Type inside the Adversary
// tab's own type selector (already unified there per #98), not a third tab.
const ContentTypeTabs = ({ creatorContentType, setCreatorContentType, editing }) => {
  if (editing || !setCreatorContentType) return null // don't let mid-edit switches orphan unsaved data
  const tabs = [{ id: 'adversary', label: 'Adversary' }, { id: 'environment', label: 'Environment' }]
  return (
    <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.35rem', padding: '0.5rem 0.75rem 0', borderBottom: '1px solid var(--border)' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => setCreatorContentType(t.id)}
          style={{
            padding: '0.4rem 0.75rem', minHeight: '36px', borderRadius: '0.25rem 0.25rem 0 0',
            border: '1px solid var(--border)', borderBottom: 'none',
            marginBottom: '-1px',
            background: creatorContentType === t.id ? 'var(--bg-primary)' : 'var(--bg-secondary)',
            color: creatorContentType === t.id ? 'var(--purple)' : 'var(--text-secondary)',
            fontWeight: creatorContentType === t.id ? 600 : 400,
            fontSize: '0.8rem', cursor: 'pointer',
          }}
        >{t.label}</button>
      ))}
    </div>
  )
}

// Renders the custom adversary/environment creator panel — extracted from
// DashboardView.jsx (#102) to keep that file from re-bloating past its
// ratcheted line budget. Pure prop-drilling wrapper; no state of its own.
const CreatorPanel = ({
  isNarrow,
  creatorContentType,
  setCreatorContentType,
  columnWidth,
  customContent,
  onCancel,
  addCustomAdversary,
  updateCustomAdversary,
  createAdversary,
  addCustomEnvironment,
  updateCustomEnvironment,
  createEnvironment,
}) => {
  const tabs = <ContentTypeTabs creatorContentType={creatorContentType} setCreatorContentType={setCreatorContentType} editing={false} />

  const environmentCreator = (
    <CustomEnvironmentCreator
      onSave={(environmentData, id) => {
        if (id) { updateCustomEnvironment(id, environmentData) } else { addCustomEnvironment(environmentData) }
        onCancel()
      }}
      onAddToEncounter={(environmentData) => {
        createEnvironment({ ...environmentData })
        onCancel()
      }}
      onCancelEdit={onCancel}
      autoFocus
      contentTypeTabs={tabs}
    />
  )

  const adversaryCreator = (
    <CustomAdversaryCreator
      onSave={(adversaryData, id) => {
        if (id) { updateCustomAdversary(id, adversaryData) } else { addCustomAdversary(adversaryData) }
        onCancel()
      }}
      onSaveAndAdd={(adversaryData) => {
        addCustomAdversary(adversaryData)
        createAdversary({ ...adversaryData })
        onCancel()
      }}
      onAddToEncounter={(adversaryData) => {
        createAdversary({ ...adversaryData })
        onCancel()
      }}
      onCancelEdit={onCancel}
      customAdversaries={customContent?.adversaries || []}
      embedded={false}
      autoFocus
      columnWidth={isNarrow ? undefined : columnWidth}
      contentTypeTabs={tabs}
    />
  )

  if (isNarrow) {
    return (
      <>
        <div style={{ position: 'absolute', inset: 0, zIndex: 99, backgroundColor: 'var(--bg-primary)' }} />
        <div style={{
          position: 'absolute',
          top: `${DASHBOARD_GAP}px`, right: `${DASHBOARD_GAP}px`,
          bottom: `${DASHBOARD_GAP}px`, left: `${DASHBOARD_GAP}px`,
          zIndex: 100,
          backgroundColor: 'var(--bg-primary)',
          border: PANEL_BORDER,
          borderRadius: PANEL_BORDER_RADIUS,
          boxShadow: PANEL_BOX_SHADOW,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {creatorContentType === 'environment' ? environmentCreator : adversaryCreator}
        </div>
      </>
    )
  }

  if (creatorContentType === 'environment') {
    // CustomEnvironmentCreator renders its own single bordered panel — wrap it
    // the same way RightColumn wraps its content.
    return (
      <div style={{
        position: 'absolute',
        top: `${DASHBOARD_GAP}px`, right: `${DASHBOARD_GAP}px`, bottom: `${DASHBOARD_GAP}px`,
        width: `${columnWidth}px`,
        zIndex: 100,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {environmentCreator}
      </div>
    )
  }

  // Desktop: CustomAdversaryCreator renders two absolute column panels itself
  return adversaryCreator
}

export default CreatorPanel
