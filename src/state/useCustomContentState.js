// Custom content state management module
import { useState, useEffect } from 'react'
import { generateId, readFromStorage, writeToStorage } from './StorageHelpers'

export function useCustomContentState() {
  const [customContent, setCustomContent] = useState({
    adversaries: [],
    environments: []
  })

  // Load custom content from localStorage on mount
  useEffect(() => {
    const customAdversaries = readFromStorage('daggerheart-custom-adversaries') || []
    const customEnvironments = readFromStorage('daggerheart-custom-environments') || []
    setCustomContent({
      adversaries: customAdversaries,
      environments: customEnvironments
    })
  }, [])

  // Save adversaries to storage whenever they change
  useEffect(() => {
    writeToStorage('daggerheart-custom-adversaries', customContent.adversaries)
  }, [customContent.adversaries])

  // Save environments to storage whenever they change
  useEffect(() => {
    writeToStorage('daggerheart-custom-environments', customContent.environments)
  }, [customContent.environments])

  const addCustomAdversary = (adversaryData) => {
    const newAdversary = {
      ...adversaryData,
      id: generateId('custom-adv'),
      source: adversaryData.source || 'Homebrew',
      isCustom: true
    }
    
    setCustomContent(prev => ({
      ...prev,
      adversaries: [...prev.adversaries, newAdversary]
    }))
    
    return newAdversary.id
  }

  const updateCustomAdversary = (id, updates) => {
    setCustomContent(prev => ({
      ...prev,
      adversaries: prev.adversaries.map(adv => 
        adv.id === id ? { ...adv, ...updates } : adv
      )
    }))
  }

  const deleteCustomAdversary = (id) => {
    setCustomContent(prev => ({
      ...prev,
      adversaries: prev.adversaries.filter(adv => adv.id !== id)
    }))
  }

  const addCustomEnvironment = (environmentData) => {
    const newEnvironment = {
      ...environmentData,
      id: generateId('custom-env'),
      source: environmentData.source || 'Homebrew',
      isCustom: true
    }

    setCustomContent(prev => ({
      ...prev,
      environments: [...prev.environments, newEnvironment]
    }))

    return newEnvironment.id
  }

  const updateCustomEnvironment = (id, updates) => {
    setCustomContent(prev => ({
      ...prev,
      environments: prev.environments.map(env =>
        env.id === id ? { ...env, ...updates } : env
      )
    }))
  }

  const deleteCustomEnvironment = (id) => {
    setCustomContent(prev => ({
      ...prev,
      environments: prev.environments.filter(env => env.id !== id)
    }))
  }

  return {
    customContent,
    addCustomAdversary,
    updateCustomAdversary,
    deleteCustomAdversary,
    addCustomEnvironment,
    updateCustomEnvironment,
    deleteCustomEnvironment
  }
}

