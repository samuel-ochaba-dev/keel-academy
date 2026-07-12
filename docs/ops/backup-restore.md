# Backup & Restore (M10–M16 Release Lane)

> Turso (libSQL/SQLite) contains user-generated data: users, sessions,
> enrollments, progress, CLI keys, submissions, and webhook/audit records.
> Course content lives in git and is not restored through Turso.

## 1. What lives where

| Data                                                          | System of record                             | Recovery method                                  |
| ------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Course content                                                | Git repository (`packages/content/content/`) | Restore a known Git revision                     |
| Users, sessions, enrollments, progress, CLI keys, submissions | Turso database                               | Turso point-in-time recovery (PITR)              |
| Runtime configuration and secrets                             | Vercel project settings                      | Re-enter from the secret manager/provider record |
| Provider event history                                        | Paddle, Inngest, Sentry dashboards           | Provider-specific retention/export process       |

## 2. Turso recovery capability

Turso creates PITR recovery data at `COMMIT`; it is not a daily-snapshot
feature. At the time this procedure was reviewed, the available recovery window
is plan-dependent: Free 24 hours, Developer 10 days, Scaler 30 days, and Pro
90 days. Confirm the selected plan and current retention in the Turso dashboard
before relying on a launch RPO. See the [Turso PITR documentation](https://docs.turso.tech/features/point-in-time-recovery).

PITR creates a **new** database from data before the requested timestamp. The
service documents a possible gap of up to 15 seconds immediately before that
timestamp, so a recovery may need a write freeze or reconciliation of data
created after the selected point.

Before a release, record the following in the release-evidence record:

- production database name and owning Turso organization;
- selected plan and its confirmed PITR retention window;
- RPO, including the possible checkpoint gap;
- recovery owner and escalation contact;
- the timestamp convention (always RFC 3339 UTC).

## 3. Restore to a new database

Run this first against staging. Do not overwrite or delete the source database
while validating the recovery.

```bash
# Create a new database from the source state immediately before the incident.
turso db create <restored-db> --from-db <source-db> --timestamp <RFC3339-UTC>

# Obtain the new connection details. Store the token only in the target
# environment's secret manager; never commit it or paste it into release notes.
turso db show <restored-db> --url
turso db tokens create <restored-db>
```

Then:

1. Record the source database, restore timestamp, new database name, operator,
   and expected data-loss window.
2. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for a **disposable staging**
   deployment to the restored database, then redeploy that staging deployment.
3. Run the QA sign-in, progress, entitlement, submission, and reference-access
   smoke checks using the controlled staging account.
4. Compare the expected post-incident writes with the restored data. Reconcile
   or explicitly accept any data after the restore timestamp before a production
   cutover.
5. For a production incident, obtain the release owner's approval before swapping
   production environment variables. Keep the original database intact until
   the new deployment and reconciliation are accepted.

This is a connection-string cutover, not an automatic zero-downtime restore.
The previous database remains the rollback target until the recovery is accepted.

## 4. Rollback and schema safety

- To roll back a failed cutover, restore the prior `TURSO_DATABASE_URL` and
  `TURSO_AUTH_TOKEN`, then redeploy the previously known-good application build.
  Account for writes made after the cutover before declaring rollback complete.
- `pnpm db:push` applies the current schema; it does **not** recover user data.
  Do not run it as a substitute for PITR. Apply a migration to a restored
  database only when the release owner has compared the restored schema to the
  intended application version.
- Do not use a production database as a staging test target. Each restore
  rehearsal uses a new disposable database.

## 5. RPO and RTO

| Metric | Release requirement                                                                 | Record before promotion                       |
| ------ | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| RPO    | Within the selected Turso plan's PITR retention, plus any documented checkpoint gap | Plan, retention, accepted data-loss window    |
| RTO    | Measured in a staging restore rehearsal, not estimated                              | Start/end time, deploy ID, smoke-check result |

No production numeric RPO/RTO claim is valid until the selected plan and a
staging rehearsal have been recorded.

## 6. Restore rehearsal

Complete at least one rehearsal before public launch:

1. Pick a staging database and a timestamp inside its confirmed PITR window.
2. Create a new restored database with the command above.
3. Point a disposable staging deployment at it with a newly issued token.
4. Verify a QA user can sign in, read a chapter, see persisted progress, submit
   a CLI result, and reach the expected entitlement/reference state.
5. Capture Turso, Vercel, application, and provider evidence in the release
   record, including the measured RTO.
6. Revoke/delete the disposable restore resources only after the evidence is
   retained and the operator confirms no investigation still needs them.

## 7. Emergency contacts

- **Turso:** dashboard support or the official Turso support channel.
- **Vercel:** project dashboard → Help → Contact Support.
- **Paddle:** dashboard support for billing or webhook-delivery incidents.
- **Release owner:** record the named owner and backup owner in the launch
  evidence for each release.
