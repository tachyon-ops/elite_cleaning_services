import { db } from "@/lib/db";
import { getAuthenticatedActor } from "./auth-helper";

/**
 * Retrieves the profile of the currently logged-in actor.
 */
export async function getMyProfile() {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    return null;
  }

  return await db.user.findUnique({
    where: { id: actor.id },
  });
}

/**
 * Retrieves a user profile by ID with access control.
 * - Staff/Admins: Can query any user profile.
 * - Customers: Can only query their own user profile.
 */
export async function getUserById(userId: string) {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const isStaff = ["super_admin", "editor", "dispatcher"].includes(actor.role);
  const isSelf = actor.id === userId;

  if (!isStaff && !isSelf) {
    throw new Error("Unauthorized: You do not have permission to view this profile.");
  }

  return await db.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Updates a user profile.
 * - Prevents non-admins from changing their role parameter (Privilege Escalation protection).
 */
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    phone?: string;
    locale?: string;
    gdprMarketingConsent?: boolean;
    role?: string;
  }
) {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const isSelf = actor.id === userId;
  const isAdmin = actor.role === "super_admin";

  if (!isSelf && !isAdmin) {
    throw new Error("Unauthorized: You do not have permission to modify this profile.");
  }

  // Prevent privilege escalation: only super_admins can change roles
  if (data.role && data.role !== actor.role && !isAdmin) {
    throw new Error("Unauthorized: Only administrators can modify role assignments.");
  }

  return await db.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phone: data.phone,
      locale: data.locale,
      gdprMarketingConsent: data.gdprMarketingConsent,
      role: isAdmin ? data.role : undefined, // Ignore role parameter for normal users
    },
  });
}

/**
 * Soft deletes a user profile (GDPR Right to Be Forgotten support).
 */
export async function softDeleteUser(userId: string) {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const isSelf = actor.id === userId;
  const isAdmin = actor.role === "super_admin";

  if (!isSelf && !isAdmin) {
    throw new Error("Unauthorized: You do not have permission to delete this profile.");
  }

  // Record audit trail and GDPR consent log before deletion
  await db.consentLog.create({
    data: {
      userId,
      email: actor.email,
      consentType: "gdpr_deletion_request",
      granted: false,
      grantedAt: new Date(),
    },
  });

  return await db.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      // Redact PII data
      name: "Redacted User",
      phone: null,
      email: `redacted-${userId}@elite-cleaning.ch`,
      passwordHash: null,
    },
  });
}
