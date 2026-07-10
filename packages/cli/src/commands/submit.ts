import { execSync } from 'node:child_process'
import { getApiKey, getApiUrl } from '../lib/config'
import { signPayload } from '../lib/crypto'
import { runTests } from '../lib/vitest-runner'
import { TEST_SUITE_VERSION } from '@keelacademy/contracts/chapter-spec'
import type { SubmissionPayload } from '@keelacademy/contracts/submission-payload'

const CLI_VERSION = '0.0.0'

export async function runSubmit(chapter: string): Promise<void> {
  const apiKey = getApiKey()
  const apiUrl = getApiUrl()

  console.log(`\nRunning chapter ${chapter} tests...`)
  const result = runTests(chapter)

  if (result.testsTotal === 0 && result.testResults.length === 0) {
    console.error('No tests ran. Check that your project is set up correctly.')
    console.error(result.rawOutput)
    process.exit(1)
  }

  for (const test of result.testResults) {
    const icon = test.passed ? 'PASS' : 'FAIL'
    console.log(`  ${icon}  ${test.name}`)
  }
  console.log(`\n${result.testsPassed}/${result.testsTotal} tests passed`)

  if (!result.allPassed) {
    console.error('\nTests failed. Fix them before submitting.')
    process.exit(1)
  }

  let commitSha: string | null = null
  try {
    commitSha = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim()
  } catch {
    // Not in a git repo — commitSha stays null
  }

  const payload: SubmissionPayload = {
    chapter,
    testsTotal: result.testsTotal,
    testsPassed: result.testsPassed,
    testResults: result.testResults,
    cliVersion: CLI_VERSION,
    testSuiteVersion: TEST_SUITE_VERSION,
    timestamp: new Date().toISOString(),
    commitSha,
  }

  const body = JSON.stringify(payload)
  const signature = signPayload(apiKey, body)

  console.log('\nSubmitting...')

  try {
    const res = await fetch(`${apiUrl}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Keel-Key': apiKey,
        'X-Keel-Signature': signature,
      },
      body,
    })

    const data = (await res.json()) as { message?: string; error?: string }

    if (res.ok) {
      console.log(`\n${data.message ?? 'Submission accepted!'}\n`)
    } else {
      console.error(
        `\n${data.error ?? data.message ?? 'Submission rejected.'}\n`,
      )
      process.exit(1)
    }
  } catch {
    console.error(
      `\nCould not connect to ${apiUrl}. Is the server running?`,
    )
    process.exit(1)
  }
}
