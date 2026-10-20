"use server";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user;
}

export async function signInWithPassword(_: string | null, formData: FormData) {
  try {
    await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirectTo: "/" });
    return null;
  } catch (error) {
    if (error instanceof AuthError) return "That email and password did not match.";
    throw error;
  }
}

export async function signOutToDashboard() {
  await signOut({ redirectTo: "/" });
}
