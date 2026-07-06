import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  async function authenticate(formData: FormData) {
    "use server";

    const name = formData.get("name");
    const email = formData.get("email");
    const next = formData.get("next")?.toString() || "/dashboard";

    try {
      await signIn("credentials", {
        name,
        email,
        redirectTo: next,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/sign-in?error=${error.type}`);
      }

      throw error;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            M0 uses a minimal credentials flow so you can test the full path
            fast.
          </CardDescription>
        </CardHeader>
        <form action={authenticate}>
          <CardContent className="space-y-4">
            <input
              type="hidden"
              name="next"
              value={params.next ?? "/dashboard"}
            />

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Samuel Ochaba"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="samuel@example.com"
                required
              />
            </div>

            {params.error ? (
              <p className="text-sm text-destructive">
                Sign-in failed. Check the form values and try again.
              </p>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Continue to dashboard
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
