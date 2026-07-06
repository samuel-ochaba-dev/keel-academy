"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { markChapterAsComplete } from "@/lib/progress";

export async function markChapterComplete(slug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/sign-in?next=/chapters/${slug}`);
  }

  await markChapterAsComplete(session.user.id, slug);
  revalidatePath("/dashboard");
  revalidatePath(`/chapters/${slug}`);
}
