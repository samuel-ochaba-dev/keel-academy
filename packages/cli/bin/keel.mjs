#!/usr/bin/env node

// M0 placeholder. The real `keel` CLI (auth, test, submit, status) lands in M6
// per docs/implementation-plan.md and ADR-006 (HMAC-signed submissions).
const [command] = process.argv.slice(2)

const banner = 'keel — the Keelacademy student CLI'

if (!command || command === 'help' || command === '--help') {
  console.log(`${banner}

Usage:
  keel auth       authenticate this machine            (M6)
  keel test <n>   run the chapter <n> test suite       (M6)
  keel submit <n> submit signed passing results        (M6)
  keel status     show your chapter progress           (M6)

These commands are not implemented yet. This is the M0 walking skeleton.`)
  process.exit(0)
}

console.log(`${banner}
"${command}" is not available yet — the CLI ships in M6.`)
process.exit(1)
