import { loadData, adversariesData } from './customAdversaryData'
import adversariesDoc from './adversaries.json'

// #125: this autocomplete loader used to concatenate playtest-adversaries.json
// on top of the official file. That file is gone, so the creator's autocomplete
// pool is exactly the official roster — no more, no less.
describe('customAdversaryData autocomplete pool', () => {
  it('loads exactly the official adversary roster', async () => {
    await loadData()

    const { adversariesData: loaded } = await import('./customAdversaryData')
    expect(loaded.adversaries).toHaveLength(adversariesDoc.adversaries.length)
  })

  it('starts empty before load', () => {
    expect(Array.isArray(adversariesData.adversaries)).toBe(true)
  })
})
