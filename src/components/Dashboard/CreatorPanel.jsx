import React from 'react'
import { DASHBOARD_GAP, PANEL_BORDER, PANEL_BORDER_RADIUS, PANEL_BOX_SHADOW } from './constants'
import CustomAdversaryCreator from '../Adversaries/CustomAdversaryCreator'
import CustomEnvironmentCreator from '../Environments/CustomEnvironmentCreator'

// Renders the custom adversary/environment creator panel — extracted from
// DashboardView.jsx (#102) to keep that file from re-bloating past its
// ratcheted line budget. Pure prop-drilling wrapper; no state of its own.
const CreatorPanel = ({
  isNarrow,
  creatorContentType,
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
