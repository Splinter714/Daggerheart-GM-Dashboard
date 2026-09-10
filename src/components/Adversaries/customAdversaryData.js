// Adversary autocomplete data loader for the custom adversary creator.
// Extracted verbatim from CustomAdversaryCreator.jsx (Phase 4). Only the main
// component reads adversariesData, so the live ES-module binding (always
// reflecting the latest reassignment here) is sufficient — no getter needed.

// Load adversary data for autocomplete
export let adversariesData = { adversaries: [] }
export let _dataLoaded = false

export const loadData = async () => {
  if (_dataLoaded) return

  let officialAdversaries = { adversaries: [] }

  try {
    const mod = await import(/* @vite-ignore */ './adversaries.json')
    officialAdversaries = mod?.default || mod
  } catch (e) {
    console.warn('Failed to load adversaries.json:', e)
  }

  adversariesData = {
    adversaries: [
      ...(officialAdversaries.adversaries || []),
    ],
  }
  _dataLoaded = true
}
