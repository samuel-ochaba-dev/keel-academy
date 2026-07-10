import { runTests } from '../lib/vitest-runner'

export async function runTest(chapter: string): Promise<void> {
  console.log(`\nRunning chapter ${chapter} tests...\n`)

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
    console.error('\nSome tests failed. Fix them before submitting.')
    process.exit(1)
  }

  console.log('\nAll tests passed!')
}
