# CI/CD, Quality, Testing & Releases — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Biome linting/formatting, c8 coverage reporting, three GitHub Actions workflows (quality, tests, release), and a tag-triggered release pipeline to already-cal.

**Architecture:** Infrastructure-only changes — no behavior modifications. Biome enforces code style, c8 reports coverage with regression thresholds, and three separate GitHub Actions workflows handle quality checks, test matrix runs, and tag-triggered releases with dist assets.

**Tech Stack:** Biome 2.4.12, c8 11.0.0, GitHub Actions, dorny/paths-filter, biomejs/setup-biome

**Spec:** `docs/superpowers/specs/2026-04-14-ci-quality-releases-design.md`

**Closes:** #19, #20, #21, #22

---

### Task 1: Create feature branch and clean working tree

The working tree currently has uncommitted Biome formatting changes from a dry run that used default config (tabs). We need to revert these and start fresh on a feature branch so the formatting uses our actual config (spaces, indent 2).

**Files:**
- No file changes — git operations only

- [ ] **Step 1: Revert all uncommitted changes**

```bash
git checkout -- .
```

- [ ] **Step 2: Remove untracked coverage directory**

```bash
rm -rf coverage/
```

- [ ] **Step 3: Create feature branch**

```bash
git checkout -b infra/ci-quality-releases
```

- [ ] **Step 4: Verify clean state**

Run: `git status`
Expected: `nothing to commit, working tree clean` on branch `infra/ci-quality-releases`

---

### Task 2: Add Biome configuration and scripts

**Files:**
- Create: `biome.json`
- Modify: `package.json` (scripts + devDependency)

- [ ] **Step 1: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.12/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": [
      "**",
      "!dist/**",
      "!**/*.min.js",
      "!**/*.min.css"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

- [ ] **Step 2: Install @biomejs/biome**

```bash
npm install --save-dev @biomejs/biome@^2.4.12
```

- [ ] **Step 3: Add `check` and `format` scripts to `package.json`**

Add these two entries to the `"scripts"` object (keep existing scripts unchanged):

```json
"check": "biome ci .",
"format": "biome check --write .",
```

The full scripts block should be:
```json
"scripts": {
  "build": "node build.cjs",
  "check": "biome ci .",
  "dev": "node build.cjs --watch",
  "format": "biome check --write .",
  "test": "node --test test/*.test.cjs test/views/*.test.cjs test/ui/*.test.cjs"
}
```

- [ ] **Step 4: Verify Biome runs**

Run: `npx biome ci .`
Expected: Exits with violations (code not yet formatted). This confirms Biome loads the config correctly.

- [ ] **Step 5: Commit**

```bash
git add biome.json package.json package-lock.json
git commit -m "chore: add Biome configuration and scripts"
```

---

### Task 3: Apply initial Biome formatting pass

**Files:**
- Modify: All `.js`, `.cjs`, `.css`, `.json` files in src/, test/, and root (excluding dist/)
- Modify: `dist/*` (rebuild only — not directly formatted)

- [ ] **Step 1: Run Biome formatting**

```bash
npm run format
```

Expected: Biome reformats files to 2-space indentation, double quotes, trailing commas, and applies safe lint fixes. The `dist/` directory is excluded by `biome.json`.

- [ ] **Step 2: Run tests to verify no breakage**

```bash
npm test
```

Expected: All tests pass. Formatting changes are whitespace/style only and should not affect behavior.

- [ ] **Step 3: Rebuild dist from formatted source**

```bash
npm run build
```

Expected: `dist/` files are regenerated from the newly formatted source.

- [ ] **Step 4: Run Biome check to verify clean state**

```bash
npm run check
```

Expected: Exit code 0, no violations.

- [ ] **Step 5: Commit all formatted files**

```bash
git add -A
git commit -m "style: apply Biome formatting to codebase"
```

Note: `git add -A` is appropriate here because this is a bulk formatting commit. Every changed file is an expected formatting change. The `.gitignore` already excludes `node_modules/`.

---

### Task 4: Add c8 coverage tooling

**Files:**
- Modify: `package.json` (devDependency + c8 config + test:coverage script)
- Modify: `.gitignore` (add coverage/)

- [ ] **Step 1: Install c8**

```bash
npm install --save-dev c8@^11.0.0
```

- [ ] **Step 2: Add `test:coverage` script to `package.json`**

Add to the `"scripts"` object:

```json
"test:coverage": "c8 node --test test/*.test.cjs test/views/*.test.cjs test/ui/*.test.cjs"
```

- [ ] **Step 3: Add c8 configuration to `package.json`**

Add a top-level `"c8"` key to `package.json`:

```json
"c8": {
  "include": ["src/**/*.js"],
  "exclude": ["dist/**", "test/**", "build.cjs"],
  "reporter": ["text", "lcov"],
  "report-dir": "coverage",
  "statements": 86,
  "branches": 80,
  "functions": 72,
  "lines": 86
}
```

Thresholds are ~5% below the measured baseline (91% stmts, 85% branches, 77% functions, 91% lines) to catch regressions without false failures.

- [ ] **Step 4: Add `coverage/` to `.gitignore`**

Append to `.gitignore`:

```
coverage/
```

- [ ] **Step 5: Run coverage to verify**

```bash
npm run test:coverage
```

Expected: All tests pass. Coverage report prints to stdout. Thresholds pass (actual coverage is above minimums). `coverage/` directory is created with lcov report.

- [ ] **Step 6: Run Biome check**

```bash
npm run check
```

Expected: Exit code 0. The package.json edits conform to Biome formatting.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add c8 coverage tooling with regression thresholds"
```

---

### Task 5: Add quality CI workflow

**Files:**
- Create: `.github/workflows/quality.yml`

- [ ] **Step 1: Create `.github/workflows/` directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/quality.yml`**

```yaml
name: Quality

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  filter-paths:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    outputs:
      changed: ${{ steps.filter.outputs.code }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          base: main
          filters: |
            code:
              - '**/*.js'
              - '**/*.cjs'
              - '**/*.css'
              - '**/*.json'
              - 'biome.json'

  biome:
    needs: filter-paths
    if: needs.filter-paths.outputs.changed == 'true'
    name: Biome
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: biomejs/setup-biome@v2
        with:
          version: latest
      - run: biome ci .
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/quality.yml
git commit -m "ci: add Biome quality check workflow"
```

---

### Task 6: Add tests CI workflow

**Files:**
- Create: `.github/workflows/tests.yml`

- [ ] **Step 1: Create `.github/workflows/tests.yml`**

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  filter-paths:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    outputs:
      changed: ${{ steps.filter.outputs.code }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          base: main
          filters: |
            code:
              - 'src/**'
              - 'test/**'
              - 'build.cjs'
              - 'package.json'
              - 'package-lock.json'

  test:
    needs: filter-paths
    if: needs.filter-paths.outputs.changed == 'true'
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    permissions:
      contents: read
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - name: Run tests with coverage
        if: matrix.node-version == 22
        run: npm run test:coverage
      - name: Run tests
        if: matrix.node-version != 22
        run: npm test
      - name: Verify build
        run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/tests.yml
git commit -m "ci: add test matrix and coverage workflow"
```

---

### Task 7: Add release workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Create GitHub Release
        run: |
          gh release create "${{ github.ref_name }}" \
            dist/already-cal.js \
            dist/already-cal.min.js \
            dist/already-cal.css \
            dist/already-cal.min.css \
            dist/already-cal.js.map \
            --generate-notes \
            --title "${{ github.ref_name }}"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add tag-triggered release workflow"
```

---

### Task 8: Final verification and PR

**Files:**
- No file changes — verification and PR creation only

- [ ] **Step 1: Run full verification suite**

```bash
npm run check && npm test && npm run test:coverage && npm run build
```

Expected: All four commands pass with exit code 0.

- [ ] **Step 2: Push branch**

```bash
git push -u origin infra/ci-quality-releases
```

- [ ] **Step 3: Create pull request**

```bash
gh pr create --title "Add CI/CD, quality tooling, coverage, and releases" --body "$(cat <<'EOF'
## Summary

- Add Biome for linting and formatting with `biome.json` config
- Add c8 for test coverage reporting with regression thresholds
- Add three GitHub Actions workflows:
  - **Quality** — Biome CI check with path filtering
  - **Tests** — Node 18/20/22 matrix with coverage on Node 22
  - **Release** — Tag-triggered builds with dist asset uploads
- Apply initial Biome formatting pass across the codebase

## Details

Infrastructure-only changes. No behavior modifications to already-cal source code.

Coverage thresholds (5% below measured baseline):
- Statements: 86% (actual: 91%)
- Branches: 80% (actual: 85%)
- Functions: 72% (actual: 77%)
- Lines: 86% (actual: 91%)

Release workflow: bump version in package.json → `git tag v<version>` → `git push origin v<version>` → workflow creates GitHub Release with dist assets.

## Test plan

- [ ] `npm run check` passes (Biome finds no violations)
- [ ] `npm test` passes (all existing tests green)
- [ ] `npm run test:coverage` passes (coverage above thresholds)
- [ ] `npm run build` succeeds (dist files generated)
- [ ] Quality workflow triggers on PR (check GitHub Actions tab)
- [ ] Tests workflow triggers on PR (check GitHub Actions tab)

Closes #19, #20, #21, #22
EOF
)"
```

Expected: PR is created. Quality and Tests workflows trigger automatically on the PR.

- [ ] **Step 4: Verify CI workflows fire**

Check the GitHub Actions tab for the PR. Both `Quality` and `Tests` workflows should trigger (the PR modifies `.js`, `.json`, and workflow files which match the path filters).
