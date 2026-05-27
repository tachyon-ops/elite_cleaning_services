import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export interface AuthenticatedActor {
  id: string;
  email: string;
  role: string; // super_admin, editor, dispatcher, registered_customer
  name: string;
}

/**
 * Retrieves the currently authenticated user's session from Supabase,
 * and fetches their matching profile metadata from the database.
 */
export async function getAuthenticatedActor(): Promise<AuthenticatedActor | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || !user.id) {
      return null;
    }

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!profile) {
      return null;
    }

    return profile;
  } catch (err) {
    console.error("Failed to authenticate session actor:", err);
    return null;
  }
}
