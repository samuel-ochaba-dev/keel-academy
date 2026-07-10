import { z } from 'zod';

/**
 * The signed payload the CLI sends to `POST /api/submissions`.
 *
 * This schema is the single source of truth (ADR-010): the CLI builds the
 * payload, the server validates it, and both import this definition so they
 * can never drift.
 */
declare const submissionPayloadSchema: z.ZodObject<{
    chapter: z.ZodString;
    testsTotal: z.ZodNumber;
    testsPassed: z.ZodNumber;
    testResults: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        passed: z.ZodBoolean;
        durationMs: z.ZodNumber;
    }, z.core.$strip>>;
    cliVersion: z.ZodString;
    testSuiteVersion: z.ZodString;
    timestamp: z.ZodString;
    commitSha: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;
type TestResultEntry = SubmissionPayload['testResults'][number];

export { type SubmissionPayload, type TestResultEntry, submissionPayloadSchema };
