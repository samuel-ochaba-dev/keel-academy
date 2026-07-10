import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CONFIG_FILE = path.join(os.homedir(), '.keelrc')

export type KeelConfig = {
  apiKey?: string
  apiUrl?: string
}

const DEFAULT_API_URL = 'https://keelacademy.com'

export function readConfig(): KeelConfig {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(content) as KeelConfig
  } catch {
    return {}
  }
}

export function writeConfig(config: KeelConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

export function getApiKey(): string {
  const config = readConfig()
  if (!config.apiKey) {
    throw new Error('Not authenticated. Run `keel auth` first.')
  }
  return config.apiKey
}

export function getApiUrl(): string {
  const config = readConfig()
  return config.apiUrl ?? process.env.KEEL_API_URL ?? DEFAULT_API_URL
}
