import { loadCustomContent, saveCustomContent, reloadData } from './DataLibrary'
import adversariesDoc from '../Adversaries/adversaries.json'
import environmentsDoc from '../Environments/environments.json'
import colossiDoc from '../Adversaries/colossi.json'

beforeEach(() => localStorage.clear())

describe('DataLibrary custom content', () => {
  it('round-trips custom adversaries through save/load', () => {
    const adversaries = [{ id: 'c1', name: 'Homebrew Beast' }]
    saveCustomContent('adversary', adversaries)

    expect(loadCustomContent().customAdversaries).toEqual(adversaries)
  })

  it('round-trips custom environments through save/load', () => {
    const environments = [{ id: 'e1', name: 'Haunted Wood' }]
    saveCustomContent('environment', environments)

    expect(loadCustomContent().customEnvironments).toEqual(environments)
  })

  it('returns empty arrays when nothing is stored', () => {
    expect(loadCustomContent()).toEqual({ customAdversaries: [], customEnvironments: [] })
  })

  it('survives corrupt JSON in storage, yielding [] instead of throwing', () => {
    localStorage.setItem('daggerheart-custom-adversaries', '{not valid json')

    expect(() => loadCustomContent()).not.toThrow()
    expect(loadCustomContent().customAdversaries).toEqual([])
  })
})

// #125: the separate playtest-adversaries.json / playtest-environments.json
// files are gone — their content is either official in SRD 2.0 or folded into
// the main files. loadData() must merge official + colossi + custom and
// nothing else, so a re-added playtest branch can't quietly double up records.
describe('DataLibrary official content merge', () => {
  it('merges official adversaries plus colossi plus custom, with no extra source', async () => {
    saveCustomContent('adversary', [{ id: 'c1', name: 'Homebrew Beast' }])

    const { adversariesData } = await reloadData()

    expect(adversariesData.adversaries).toHaveLength(
      adversariesDoc.adversaries.length + colossiDoc.colossi.length + 1,
    )
    expect(adversariesData.adversaries.filter((a) => a.isColossus)).toHaveLength(
      colossiDoc.colossi.length,
    )
  })

  it('merges official environments plus custom, with no extra source', async () => {
    saveCustomContent('environment', [{ id: 'e1', name: 'Haunted Wood' }])

    const { environmentsData } = await reloadData()

    expect(environmentsData.environments).toHaveLength(environmentsDoc.environments.length + 1)
  })

  it('yields no duplicate adversary ids once everything is merged', async () => {
    const { adversariesData } = await reloadData()

    const ids = adversariesData.adversaries.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
