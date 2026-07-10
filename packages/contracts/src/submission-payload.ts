import { z } from 'zod'

/**
 * The signed payload the CLI sends to `POST /api/submissions`.
 *
 * This schema is the single source of truth (ADR-010): the CLI builds the
 * payload, the server validates it, and both import this definition so they
 * can never drift.
 */
export const submissionPayloadSchema = z.object({
  chapter: z.string().regex(/^\d{2}$/),
  testsTotal: z.number().int().positive(),
  testsPassed: z.number().int().min(0),
  testResults: z.array(
    z.object({
      name: z.string(),
      passed: z.boolean(),
      durationMs: z.number().int().min(0),
    }),
  ),
  cliVersion: z.string(),
  testSuiteVersion: z.string(),
  timestamp: z.string().datetime(),
  commitSha: z.string().nullable().optional(),
})

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>

export type TestResultEntry = SubmissionPayload['testResults'][number]
