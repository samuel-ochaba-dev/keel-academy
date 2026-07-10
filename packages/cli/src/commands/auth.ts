import { exec } from 'node:child_process'
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { getApiUrl, readConfig, writeConfig } from '../lib/config'

export async function runAuth(options: {
  apiUrl?: string
}): Promise<void> {
  const apiUrl = options.apiUrl ?? getApiUrl()

  console.log(`\nOpening ${apiUrl}/account in your browser...`)
  console.log('Create an API key, then paste it below.\n')

  openBrowser(`${apiUrl}/account`)

  const rl = readline.createInterface({ input: stdin, output: stdout })
  const apiKey = (await rl.question('Paste your API key: ')).trim()
  rl.close()

  if (!apiKey) {
    console.error('No API key provided.')
    process.exit(1)
  }

  console.log('\nVerifying...')
  try {
    const res = await fetch(`${apiUrl}/api/account/status`, {
      headers: { 'X-Keel-Key': apiKey },
    })
    if (!res.ok) {
      console.error('Invalid API key. Please check the key and try again.')
      process.exit(1)
    }
    const data = (await res.json()) as { email: string }

    const existing = readConfig()
    writeConfig({ ...existing, apiKey, apiUrl })

    console.log(`\nAuthenticated as ${data.email}`)
    console.log('API key saved to ~/.keelrc')
  } catch {
    console.error(
      `Could not connect to ${apiUrl}. Is the server running?`,
    )
    process.exit(1)
  }
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`
  exec(cmd, (err) => {
    if (err) {
      console.log(`Could not open browser. Visit ${url} manually.`)
    }
  })
}
