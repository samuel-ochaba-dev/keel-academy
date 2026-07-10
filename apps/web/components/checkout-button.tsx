'use client'

import { useCallback, useEffect, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { useTheme } from 'next-themes'
import { env } from '@/lib/env'
import { Button } from '@/components/ui/button'

// Overlay checkout island (Paddle.js). Paddle.Initialize can only run once per
// page, so a single instance is created lazily and reused. The purchase is
// *never* fulfilled here — the overlay's success is cosmetic; access is granted
// only when the signed webhook writes the enrollment row. successUrl just
// returns the buyer to /billing, which reflects live DB state.
type CheckoutButtonProps = {
  userId: string
  email: string
  priceId: string
  label: string
}

export function CheckoutButton({
  userId,
  email,
  priceId,
  label,
}: CheckoutButtonProps) {
  const { resolvedTheme } = useTheme()
  const [paddle, setPaddle] = useState<Paddle | undefined>()

  useEffect(() => {
    if (!env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) return
    let active = true
    initializePaddle({
      environment: env.NEXT_PUBLIC_PADDLE_ENV,
      token: env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    }).then((instance) => {
      if (active) setPaddle(instance)
    })
    return () => {
      active = false
    }
  }, [])

  const openCheckout = useCallback(() => {
    if (!paddle) return
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email },
      // The webhook reads customData.userId to map the purchase back to the
      // account, independent of any redirect param.
      customData: { userId },
      settings: {
        displayMode: 'overlay',
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        successUrl:
          typeof window !== 'undefined'
            ? `${window.location.origin}/billing?checkout=success`
            : undefined,
      },
    })
  }, [paddle, priceId, email, userId, resolvedTheme])

  return (
    <Button onClick={openCheckout} disabled={!paddle} className="w-full">
      {label}
    </Button>
  )
}
