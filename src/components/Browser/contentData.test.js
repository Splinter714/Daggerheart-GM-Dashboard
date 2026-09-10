import adversariesDoc from '../Adversaries/adversaries.json'
import environmentsDoc from '../Environments/environments.json'
import colossiDoc from '../Adversaries/colossi.json'

// #125: the shipped SRD content is data, not code, so nothing else in the test
// net would notice if an import/regeneration pass silently dropped records,
// duplicated an id (saved encounters resolve by id) or left markdown emphasis
// in a description — `textHighlighter.jsx` styles plain text at render time and
// would print literal ** / _ instead.

const ADVERSARIES = adversariesDoc.adversaries
const ENVIRONMENTS = environmentsDoc.environments

// Provenance shown by BrowserRow's BookOpen tooltip (`title={item.source}`).
const ADVERSARY_SOURCES = {
  'Daggerheart SRD 2.0': 129,
  'Daggerheart SRD 2.0 (Hope & Fear)': 135,
  'Daggerheart Playtest': 1,
}
const ENVIRONMENT_SOURCES = {
  'Daggerheart SRD 2.0': 12,
  'Daggerheart SRD 2.0 (Hope & Fear)': 28,
  'Unknown': 8,
  'Daggerheart Playtest': 1,
}

const countBySource = (records) =>
  records.reduce((acc, r) => ({ ...acc, [r.source]: (acc[r.source] || 0) + 1 }), {})

// FeaturesSection.jsx / EnvironmentFeaturesSection.jsx only render these three
// buckets — any other type is silently invisible on the card.
const FEATURE_TYPES = ['Action', 'Passive', 'Reaction']

const hasMarkdownEmphasis = (s) => /\*\*.+?\*\*|_[^_]+_/.test(s)

describe('adversaries.json', () => {
  it('ships the full SRD 2.0 roster', () => {
    expect(ADVERSARIES).toHaveLength(265)
  })

  it('has metadata whose total matches the actual record count', () => {
    expect(adversariesDoc.metadata.totalAdversaries).toBe(ADVERSARIES.length)
    expect(adversariesDoc.metadata.source).toMatch(/SRD 2\.0/)
  })

  it('has unique ids (saved encounters resolve adversaries by id)', () => {
    const ids = ADVERSARIES.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('carries a known source on every record', () => {
    expect(countBySource(ADVERSARIES)).toEqual(ADVERSARY_SOURCES)
  })

  it('fixes the Courter OCR typo (SRD 2.0 p.98 reads "Courtier")', () => {
    const names = ADVERSARIES.map((a) => a.name)
    expect(names).toContain('Courtier')
    expect(names).not.toContain('Courter')
  })

  // #125 assumed "Outer Realms Corrupter" was an OCR typo for "Corruptor" and
  // that the creature was cut from SRD 2.0. The PDF (p.153) says otherwise —
  // the stat block is headed OUTER REALMS CORRUPTER with SRD 1.0's stats
  // unchanged, so our record was already right and there must be exactly one.
  it('lists Outer Realms Corrupter exactly once, under the SRD 2.0 spelling', () => {
    const matches = ADVERSARIES.filter((a) => /Outer Realms Corrupt/.test(a.name))
    expect(matches.map((a) => a.name)).toEqual(['Outer Realms Corrupter'])
    expect(matches[0].id).toBe('outer-realms-corrupter')
  })

  it('folds the Doppelhünd playtest orphan into the main file', () => {
    const doppel = ADVERSARIES.find((a) => a.id === 'doppelhund')
    expect(doppel).toBeDefined()
    expect(doppel.source).toBe('Daggerheart Playtest')
  })

  it('has non-null required fields on every record', () => {
    const broken = ADVERSARIES.filter(
      (a) =>
        !a.id ||
        !a.name ||
        !a.description ||
        !a.motives ||
        !a.weapon ||
        !a.range ||
        !a.damage ||
        !Number.isInteger(a.tier) ||
        !a.type ||
        typeof a.difficulty !== 'number' ||
        typeof a.hpMax !== 'number' ||
        a.atk === undefined ||
        !Array.isArray(a.features),
    )
    expect(broken.map((a) => a.name)).toEqual([])
  })

  it('gives every feature a renderable type and plain-text description', () => {
    const broken = ADVERSARIES.flatMap((a) =>
      a.features
        .filter(
          (f) =>
            !f.name ||
            !FEATURE_TYPES.includes(f.type) ||
            !f.description ||
            hasMarkdownEmphasis(f.description),
        )
        .map((f) => `${a.name} / ${f.name || '(unnamed)'}`),
    )
    expect(broken).toEqual([])
  })

  it('keeps damageThreshold in sync with the major threshold', () => {
    const broken = ADVERSARIES.filter(
      (a) => a.damageThreshold !== (a.thresholds ? a.thresholds.major : null),
    )
    expect(broken.map((a) => a.name)).toEqual([])
  })

  it('does not collide with colossus ids (both merge into one browser list)', () => {
    const advIds = new Set(ADVERSARIES.map((a) => a.id))
    expect(colossiDoc.colossi.filter((c) => advIds.has(c.id))).toEqual([])
  })
})

describe('environments.json', () => {
  it('ships the full SRD 2.0 roster', () => {
    expect(ENVIRONMENTS).toHaveLength(49)
  })

  it('has metadata whose total matches the actual record count', () => {
    expect(environmentsDoc.metadata.totalEnvironments).toBe(ENVIRONMENTS.length)
    expect(environmentsDoc.metadata.source).toMatch(/SRD 2\.0/)
  })

  it('has unique ids', () => {
    const ids = ENVIRONMENTS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('carries a known source on every record', () => {
    expect(countBySource(ENVIRONMENTS)).toEqual(ENVIRONMENT_SOURCES)
  })

  it('folds the Void Chamber playtest orphan into the main file', () => {
    const voidChamber = ENVIRONMENTS.find((e) => e.name === 'Void Chamber')
    expect(voidChamber).toBeDefined()
    expect(voidChamber.source).toBe('Daggerheart Playtest')
  })

  it('has non-null required fields on every record', () => {
    const broken = ENVIRONMENTS.filter(
      (e) =>
        !e.id ||
        !e.name ||
        !e.description ||
        !e.impulses ||
        !Number.isInteger(e.tier) ||
        !e.type ||
        e.difficulty === undefined ||
        e.difficulty === null ||
        !Array.isArray(e.potentialAdversaries) ||
        e.potentialAdversaries.length === 0,
    )
    expect(broken.map((e) => e.name)).toEqual([])
  })

  it('gives every feature a renderable type and plain-text description', () => {
    const broken = ENVIRONMENTS.flatMap((e) =>
      (e.features || [])
        .filter(
          (f) =>
            !f.name ||
            !FEATURE_TYPES.includes(f.type) ||
            !f.description ||
            hasMarkdownEmphasis(f.description),
        )
        .map((f) => `${e.name} / ${f.name || '(unnamed)'}`),
    )
    expect(broken).toEqual([])
  })
})
