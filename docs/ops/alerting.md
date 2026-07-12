# Observability Alert Thresholds (M8)

Last updated: 2026-07-12

## What we monitor

| Signal           | Source                      | Tool                      |
| ---------------- | --------------------------- | ------------------------- |
| Unhandled errors | Sentry                      | Sentry                    |
| API error rate   | `audit_event` (`api.error`) | Inngest + admin dashboard |
| Cron health      | Inngest function runs       | Inngest                   |
| Page performance | Vercel Analytics            | Vercel                    |

## Alert thresholds

### Sentry

- **P0 – critical**: Error count > 10 in 5 minutes on production → page ops via Sentry alert rule
- **P1 – warning**: Error count > 50 in 1 hour → Slack notification via Sentry integration
- **P2 – informational**: New issue type first seen → Sentry issue alert

### API error rate (`api.error` audit events)

- **P0**: > 5% error rate over a 5-minute rolling window → trigger Inngest function that sends alert
- **P1**: > 2% error rate over 30 minutes → daily summary email to ops

### Cron health

- **P0**: Any Inngest cron function fails 3 consecutive scheduled runs → alert
- **P1**: Cron function run time exceeds 30 seconds (indicating DB or network degradation)

### Vercel Analytics

- **P1**: P75 FCP > 2.5 s on any page → investigate bundle size / data fetching
- **P2**: CLS > 0.25 on any page → investigate layout shift causes

## Response checklist

1. Check Sentry issue details — stack trace, release, affected users
2. Check `/admin/events` for correlated `api.error` events
3. Check Inngest dashboard for failed function runs
4. If DB-related: check Turso dashboard for replica health
5. If deploy-related: check Vercel deployment logs
6. Post incident to `#ops-incidents` Slack channel with timeline

## On-call

- Currently: engineering team during business hours (UTC+1)
- Future: PagerDuty for P0 after GA
