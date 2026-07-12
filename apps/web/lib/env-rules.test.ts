import { describe, expect, it } from 'vitest'
import { getProductionBillingConfigErrors } from './env'

const completeBillingEnv = {
  NEXT_PUBLIC_PADDLE_ENV: 'production' as const,
  PADDLE_API_KEY: 'pdl_api_key',
  PADDLE_WEBHOOK_SECRET: 'pdl_ntfset_secret',
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: 'test_client_token',
  NEXT_PUBLIC_PADDLE_PRICE_MONTHLY: 'pri_monthly',
  NEXT_PUBLIC_PADDLE_PRICE_LIFETIME: 'pri_lifetime',
}

describe('getProductionBillingConfigErrors', () => {
  it('allows open billing only outside production', () => {
    expect(
      getProductionBillingConfigErrors({
        NEXT_PUBLIC_PADDLE_ENV: 'sandbox',
      }),
    ).toEqual([])
  })

  it('requires every billing secret and public price id in production', () => {
    expect(
      getProductionBillingConfigErrors({
        NEXT_PUBLIC_PADDLE_ENV: 'production',
      }),
    ).toEqual([
      'PADDLE_API_KEY is required in production',
      'PADDLE_WEBHOOK_SECRET is required in production',
      'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is required in production',
      'NEXT_PUBLIC_PADDLE_PRICE_MONTHLY is required in production',
      'NEXT_PUBLIC_PADDLE_PRICE_LIFETIME is required in production',
    ])
  })

  it('rejects forced billing mode in production', () => {
    expect(
      getProductionBillingConfigErrors({
        ...completeBillingEnv,
        BILLING_FORCE_ENABLED: true,
      }),
    ).toEqual(['BILLING_FORCE_ENABLED must not be set in production'])
  })

  it('treats a Vercel production deployment as production', () => {
    expect(
      getProductionBillingConfigErrors({
        NEXT_PUBLIC_PADDLE_ENV: 'sandbox',
        VERCEL_ENV: 'production',
      }),
    ).toContain('PADDLE_API_KEY is required in production')
  })
})
