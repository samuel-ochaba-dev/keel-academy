import { createRequire } from 'node:module'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import type { TestResultEntry } from '@keelacademy/contracts/submission-payload'

const require = createRequire(import.meta.url)

type VitestJsonReport = {
  numTotalTests: number
  numPassedTests: number
  testResults: Array<{
    assertionResults: Array<{
      title: string
      status: 'passed' | 'failed' | 'skipped' | 'pending' | 'todo'
      duration: number | null
    }>
  }>
}

export type TestRunResult = {
  testsTotal: number
  testsPassed: number
  allPassed: boolean
  testResults: TestResultEntry[]
  rawOutput: string
}

function resolveVitestBin(): string {
  const vitestPkgPath = require.resolve('vitest/package.json')
  const vitestPkg = JSON.parse(readFileSync(vitestPkgPath, 'utf-8')) as {
    bin: string | Record<string, string>
  }
  const binEntry =
    typeof vitestPkg.bin === 'string'
      ? vitestPkg.bin
      : (vitestPkg.bin?.vitest ?? 'cli.js')
  return path.resolve(path.dirname(vitestPkgPath), binEntry)
}

function resolveChapterConfig(chapter: string): string {
  const pkgPath = require.resolve('@keelacademy/test-suite/package.json')
  const packageDir = path.dirname(pkgPath)
  const configPath = path.join(
    packageDir,
    'src',
    'chapters',
    chapter,
    'vitest.config.ts',
  )
  if (!existsSync(configPath)) {
    throw new Error(
      `No test suite found for chapter ${chapter}. Available chapters: 01`,
    )
  }
  return configPath
}

export function runTests(chapter: string): TestRunResult {
  const configPath = resolveChapterConfig(chapter)
  const vitestBin = resolveVitestBin()
  const outputDir = mkdtempSync(path.join(tmpdir(), 'keel-test-'))
  const outputPath = path.join(outputDir, 'results.json')

  const result = spawnSync(
    process.execPath,
    [
      vitestBin,
      'run',
      '--config',
      configPath,
      '--reporter=json',
      `--outputFile=${outputPath}`,
    ],
    { encoding: 'utf-8', cwd: process.cwd() },
  )

  let report: VitestJsonReport | null = null
  try {
    const json = readFileSync(outputPath, 'utf-8')
    report = JSON.parse(json) as VitestJsonReport
  } catch {
    // Vitest failed to produce JSON output (e.g. config error, no tests)
  }

  try {
    rmSync(outputDir, { recursive: true })
  } catch {
    // ignore cleanup errors
  }

  if (!report) {
    return {
      testsTotal: 0,
      testsPassed: 0,
      allPassed: false,
      testResults: [],
      rawOutput: (result.stdout ?? '') + (result.stderr ?? ''),
    }
  }

  const testResults: TestResultEntry[] = report.testResults.flatMap(
    (file) =>
      file.assertionResults.map((assertion) => ({
        name: assertion.title,
        passed: assertion.status === 'passed',
        durationMs: assertion.duration ?? 0,
      })),
  )

  return {
    testsTotal: report.numTotalTests,
    testsPassed: report.numPassedTests,
    allPassed: report.numPassedTests === report.numTotalTests,
    testResults,
    rawOutput: result.stdout ?? '',
  }
}
