// Minions add/remove a full party-size group per click (EntityColumns.jsx's
// isMinion ? pcCount : 1), so the quick-edit stepper's displayed count and its
// last-one delete-confirm threshold must speak in groups, not raw instances,
// for Minions specifically (#30 playtest 2026-07-05).
export const useMinionGroupCount = (item, instances, pcCount) => {
  const groupSize = item?.type === 'Minion' ? Math.max(1, pcCount) : 1
  return Math.ceil(instances.length / groupSize)
}

export default useMinionGroupCount
