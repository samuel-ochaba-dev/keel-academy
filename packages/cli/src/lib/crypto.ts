import crypto from 'node:crypto'

export function signPayload(apiKey: string, body: string): string {
  return crypto.createHmac('sha256', apiKey).update(body).digest('hex')
}
