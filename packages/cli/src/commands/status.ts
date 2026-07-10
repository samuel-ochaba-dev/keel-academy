import { getApiKey, getApiUrl } from '../lib/config'

type StatusResponse = {
  email: string
  submissions: Array<{
    chapterOrder: number
    chapterTitle: string
    status: string
    testsPassed: number
    testsTotal: number
    submittedAt: string
  }>
}

export async function runStatus(): Promise<void> {
  const apiKey = getApiKey()
  const apiUrl = getApiUrl()

  try {
    const res = await fetch(`${apiUrl}/api/account/status`, {
      headers: { 'X-Keel-Key': apiKey },
    })

    if (!res.ok) {
      console.error(
        'Could not fetch status. Your API key may be invalid or revoked.',
      )
      process.exit(1)
    }

    const data = (await res.json()) as StatusResponse

    console.log(`\nSigned in as ${data.email}\n`)

    if (data.submissions.length === 0) {
      console.log(
        'No submissions yet. Run `keel submit <chapter>` to submit test results.',
      )
      console.log()
      return
    }

    console.log('Chapter submissions:')
    for (const sub of data.submissions) {
      const icon = sub.status === 'passed' ? 'PASS' : 'FAIL'
      console.log(
        `  ${icon}  Ch ${sub.chapterOrder}: ${sub.chapterTitle} — ${sub.testsPassed}/${sub.testsTotal} tests (${sub.status})`,
      )
    }
    console.log()
  } catch {
    console.error(
      `\nCould not connect to ${apiUrl}. Is the server running?`,
    )
    process.exit(1)
  }
}
