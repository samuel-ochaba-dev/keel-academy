import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import { sessionPlaceholders, users } from "@/lib/schema";

const signInSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(80),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "email",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
      },
      authorize: async (rawCredentials) => {
        const parsed = signInSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const name = parsed.data.name;

        const existingUser = await db.query.users.findFirst({
          where: (table, { eq }) => eq(table.email, email),
        });

        if (existingUser) {
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
          };
        }

        const [createdUser] = await db
          .insert(users)
          .values({
            email,
            name,
          })
          .returning();

        await db.insert(sessionPlaceholders).values({
          userId: createdUser.id,
          note: "M0 placeholder row. Auth.js is using JWT sessions for now.",
        });

        return {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
