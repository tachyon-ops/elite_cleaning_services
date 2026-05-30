"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getAuthenticatedActor } from "@/lib/db/auth-helper";
import { updateUserProfile } from "@/lib/db/users";

/**
 * Updates the user's preferred language.
 * Enforces a cookie setting for guests, and updates the user profile
 * in the database for authenticated admins, provider staff, or customers.
 */
export async function updateUserLocale(locale: string) {
  const cookieStore = await cookies();
  const normalized = locale.toLowerCase().slice(0, 2);

  // Set cookie for guest and authenticated persistence
  cookieStore.set("NEXT_LOCALE", normalized, {
    path: "/",
    httpOnly: false, // Must be readable on client to prevent flash
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  try {
    // 1. Admin role check
    const isAdmin = cookieStore.get("admin_session")?.value === "true";
    const adminId = cookieStore.get("admin_user_id")?.value;
    if (isAdmin && adminId) {
      await db.user.update({
        where: { id: adminId },
        data: { locale: normalized },
      });
      return { success: true };
    }

    // 2. Provider staff role check
    const providerEmail = cookieStore.get("provider_email")?.value;
    if (providerEmail) {
      const user = await db.user.findFirst({
        where: { email: providerEmail, role: "provider_staff" },
      });
      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: { locale: normalized },
        });
        return { success: true };
      }
    }

    // 3. Supabase customer check
    const actor = await getAuthenticatedActor();
    if (actor && actor.id) {
      await updateUserProfile(actor.id, { locale: normalized });
      return { success: true };
    }
  } catch (error: any) {
    console.error("Failed to sync locale to user database profile:", error.message);
  }

  return { success: true };
}
