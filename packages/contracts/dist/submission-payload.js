// src/submission-payload.ts
import { z } from "zod";
var submissionPayloadSchema = z.object({
  chapter: z.string().regex(/^\d{2}$/),
  testsTotal: z.number().int().positive(),
  testsPassed: z.number().int().min(0),
  testResults: z.array(
    z.object({
      name: z.string(),
      passed: z.boolean(),
      durationMs: z.number().int().min(0)
    })
  ),
  cliVersion: z.string(),
  testSuiteVersion: z.string(),
  timestamp: z.string().datetime(),
  commitSha: z.string().nullable().optional()
});
export {
  submissionPayloadSchema
};
