import { Command } from 'commander'
import { runAuth } from './commands/auth'
import { runTest } from './commands/test'
import { runSubmit } from './commands/submit'
import { runStatus } from './commands/status'

const program = new Command()

program
  .name('keel')
  .description('The Keelacademy student CLI')
  .version('0.0.0')

program
  .command('auth')
  .description('Authenticate this machine with your Keelacademy account')
  .option('--api-url <url>', 'API base URL')
  .action(async (options: { apiUrl?: string }) => {
    await runAuth(options)
  })

program
  .command('test <chapter>')
  .description('Run the chapter test suite locally')
  .action(async (chapter: string) => {
    await runTest(chapter)
  })

program
  .command('submit <chapter>')
  .description('Run tests and submit signed results to Keelacademy')
  .action(async (chapter: string) => {
    await runSubmit(chapter)
  })

program
  .command('status')
  .description('Show your chapter submission progress')
  .action(async () => {
    await runStatus()
  })

program.parseAsync(process.argv)
