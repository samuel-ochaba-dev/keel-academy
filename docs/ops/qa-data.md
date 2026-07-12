# QA Data Policy

> The repository intentionally has no `pnpm db:seed` command. A generic seed
> command is too easy to point at production; controlled QA data is created only
> in staging through the real product paths.

## Rules

- Never create demo, seed, or test data in the production Turso database.
- Never use production customer data, credentials, OAuth accounts, or payment
  methods in staging.
- Use a dedicated staging mailbox/alias owned by the release owner. Record its
  address and cleanup date in the private release-evidence record, not in git.
- Treat staging API keys, Paddle sandbox purchases, and provider event IDs as
  test artifacts. Revoke or expire them after the validation window.

## Create the controlled staging user

1. Deploy the candidate to the stable staging URL with isolated staging
   credentials.
2. Start the normal magic-link sign-in flow using the dedicated staging mailbox;
   do not insert a user directly into Turso.
3. Record the generated QA user ID, test date, and owning operator in the
   private release-evidence record.
4. Use the normal UI to create any API key needed for the CLI smoke path.
5. Use the Paddle **sandbox** checkout/webhook path to create an enrolled test
   user. If an entitlement fixture is temporarily required, it must be limited to
   staging, documented with an expiry, and removed after the test.

## Reset and cleanup

- Revoke staging API keys through the account UI after CLI validation.
- Remove or disable the QA account and any staging-only entitlement fixture when
  the release window ends, unless a documented long-lived smoke account is
  intentionally retained.
- Delete disposable PITR restore databases and revoke their tokens after the
  restore evidence is accepted.
- Record what was retained, who owns it, and its next review date.

## If a seed command is added later

Any future `db:seed` script must be a separately reviewed change and must:

- refuse to run unless an explicit non-production environment identity is set;
- refuse any Turso database name or Vercel environment marked production;
- require a deliberate confirmation flag;
- use deterministic, clearly synthetic data; and
- have an automated test proving the production refusal path.
