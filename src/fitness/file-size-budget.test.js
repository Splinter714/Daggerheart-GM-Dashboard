import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// Fitness guard: ratcheting line-size budget.
//
// Every source file must stay under a cap. New files share a strict global
// default; the known mega-files are grandfathered at their CURRENT size. The
// grandfathered numbers are a RATCHET — only ever edit them DOWNWARD (e.g. as a
// Phase-4 split shrinks a file). If a session re-bloats a file past its cap,
// this test fails loudly with the file, its size, and the budget it broke.

const SRC_ROOT = join(process.cwd(), 'src')

// Files over the global cap, grandfathered at their size as of this commit.
// Lower these as the files shrink; never raise them.
const BUDGETS = {
  'src/components/Browser/Browser.jsx': 882,
  'src/components/Adversaries/CustomAdversaryCreator.jsx': 932,
  'src/components/Adversaries/GameCard.jsx': 1257, // #30: +1 prop (pcCount), +1 import; group-size calc extracted to GameCard/hooks/useMinionGroupCount.js
  'src/components/Dashboard/DashboardView.jsx': 581,
  'src/components/Dashboard/EntityColumns.jsx': 585,
}

// Every other source file must stay under this.
const DEFAULT_BUDGET = 500

function collectSourceFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...collectSourceFiles(full))
    } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\.(js|jsx)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

// Match `wc -l`: count newline characters.
function lineCount(file) {
  return readFileSync(file, 'utf8').split('\n').length - 1
}

describe('file-size budget (ratcheting)', () => {
  const files = collectSourceFiles(SRC_ROOT)

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((f) => relative(process.cwd(), f)))('%s stays within its line budget', (rel) => {
    const budget = BUDGETS[rel] ?? DEFAULT_BUDGET
    const lines = lineCount(join(process.cwd(), rel))
    expect(
      lines,
      `${rel} has ${lines} lines, over its budget of ${budget}. ` +
        (rel in BUDGETS
          ? 'This file is grandfathered — split it or shrink it; do not raise the budget.'
          : `New/other files must stay under ${DEFAULT_BUDGET} lines. Split it before adding more.`),
    ).toBeLessThanOrEqual(budget)
  })

  it('has no stale grandfather entries (each budgeted file still exists and still exceeds the default)', () => {
    for (const [rel, budget] of Object.entries(BUDGETS)) {
      const lines = lineCount(join(process.cwd(), rel))
      // If a grandfathered file dropped under the default cap, retire its entry
      // so the ratchet keeps tightening.
      expect(
        budget,
        `${rel} budget (${budget}) should match or exceed its current size (${lines}); lower it to ratchet down.`,
      ).toBeGreaterThanOrEqual(lines)
      expect(
        lines,
        `${rel} is now ${lines} lines, under the ${DEFAULT_BUDGET} default — remove its grandfather entry from BUDGETS.`,
      ).toBeGreaterThan(DEFAULT_BUDGET)
    }
  })
})
