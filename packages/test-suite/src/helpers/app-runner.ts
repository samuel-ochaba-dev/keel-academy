import { spawn, type ChildProcess } from 'node:child_process'

/**
 * Start the student's app as a child process and wait until it accepts
 * connections on the given port. The process inherits `process.cwd()` so the
 * student runs `keel test` from their project root.
 */
export async function startApp(
  command: string,
  args: string[],
  port: number,
  timeoutMs = 15_000,
): Promise<ChildProcess> {
  const proc = spawn(command, args, {
    stdio: 'pipe',
    cwd: process.cwd(),
  })

  await waitForPort(port, timeoutMs)
  return proc
}

async function waitForPort(port: number, timeoutMs: number): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(`http://localhost:${port}/`)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 200))
    }
  }
  throw new Error(
    `Server on port ${port} did not respond within ${timeoutMs}ms. ` +
      'Make sure you can run your app (e.g. `python -m api.wsgi`) from this directory.',
  )
}

export function stopApp(proc: ChildProcess | null): void {
  if (!proc) return
  proc.kill('SIGTERM')
}
