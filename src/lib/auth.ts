import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("NextAuth Authorize triggered:", credentials);
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          throw new Error("Please enter both email and password.");
        }

        // Fetch user from DB
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        console.log("User fetched from DB:", user ? { id: user.id, email: user.email, role: user.role } : null);

        if (!user || !user.password) {
          console.log("User not found or missing password hash");
          throw new Error("Invalid email or password.");
        }

        // Check password validity
        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log("Password compare result:", isValid);

        if (!isValid) {
          console.log("Password mismatch");
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};