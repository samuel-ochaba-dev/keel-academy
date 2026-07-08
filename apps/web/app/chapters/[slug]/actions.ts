'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { markChapterComplete } from '@/lib/progress/service'

export async function completeChapterAction(slug: string) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/sign-in?next=/chapters/${slug}`)
  }

  await markChapterComplete(session.user.id, slug)
  revalidatePath('/dashboard')
  revalidatePath(`/chapters/${slug}`)
}
