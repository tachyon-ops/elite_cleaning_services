"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";

// 1. Submit Application
export async function applyProvider(payload: {
  companyName: string;
  applicantEmail: string;
  applicantName: string;
  legalEntityType: string;
  verticalsRequested: string[];
  region: string;
  motivation: string;
}) {
  try {
    const { companyName, applicantEmail, applicantName, legalEntityType, verticalsRequested, region, motivation } = payload;

    if (!companyName || !applicantEmail || !applicantName) {
      throw new Error("Missing required application fields");
    }

    const application = await db.providerApplication.create({
      data: {
        companyName,
        applicantEmail,
        applicantName,
        legalEntityType,
        verticalsRequested: verticalsRequested.join(","),
        region,
        status: "submitted",
        applicationData: JSON.stringify({ motivation })
      }
    });

    return { success: true, applicationId: application.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Authentication simulation
export async function loginProvider(email: string, passphrase: string) {
  try {
    const user = await db.user.findFirst({
      where: { email, role: "provider_staff" }
    });

    if (!user || user.passwordHash !== passphrase) {
      throw new Error("Invalid provider credentials");
    }

    const cookieStore = await cookies();
    cookieStore.set("provider_session", "true", { httpOnly: true, secure: true, path: "/" });
    cookieStore.set("provider_email", user.email, { httpOnly: true, secure: true, path: "/" });
    cookieStore.set("provider_company_id", user.providerCompanyId || "", { httpOnly: true, secure: true, path: "/" });

    return { success: true, companyId: user.providerCompanyId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutProvider() {
  const cookieStore = await cookies();
  cookieStore.delete("provider_session");
  cookieStore.delete("provider_email");
  cookieStore.delete("provider_company_id");
  return { success: true };
}

export async function isProviderAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("provider_session")?.value === "true";
}

export async function getProviderCompanyId() {
  const cookieStore = await cookies();
  return cookieStore.get("provider_company_id")?.value || null;
}

// 3. Get Portal Data
export async function getProviderPortalData(companyId: string) {
  try {
    const provider = await db.provider.findUnique({
      where: { id: companyId },
      include: {
        teams: true,
        listings: true,
        documents: true
      }
    });

    if (!provider) {
      throw new Error("Provider company not found");
    }

    // Fetch offers
    const offers = await db.providerOffer.findMany({
      where: { providerId: companyId },
      include: {
        booking: true
      },
      orderBy: { offeredAt: "desc" }
    });

    // Fetch active bookings assigned
    const teamIds = provider.teams.map(t => t.id);
    const bookings = await db.booking.findMany({
      where: {
        providerTeamId: { in: teamIds }
      },
      orderBy: { scheduledAt: "asc" }
    });

    return { success: true, provider, offers, bookings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Respond to Offer
export async function respondToOffer(payload: {
  offerId: string;
  response: "accepted" | "declined";
  declineReason?: string;
}) {
  try {
    const { offerId, response, declineReason } = payload;

    const offer = await db.providerOffer.findUnique({
      where: { id: offerId },
      include: { booking: true }
    });

    if (!offer) {
      throw new Error("Offer not found");
    }

    if (offer.response !== "pending") {
      throw new Error("Offer has already been processed");
    }

    // Update Offer
    await db.providerOffer.update({
      where: { id: offerId },
      data: {
        response,
        responseAt: new Date(),
        declineReason: response === "declined" ? declineReason : null
      }
    });

    if (response === "accepted") {
      // Find a team under this provider that operates the service category
      const providerTeams = await db.providerTeam.findMany({
        where: { providerId: offer.providerId }
      });

      const matchedTeam = providerTeams.find(team => {
        try {
          const cats = JSON.parse(team.serviceCategories);
          return cats.includes(offer.booking.categorySlug);
        } catch {
          return false;
        }
      });

      const teamId = matchedTeam ? matchedTeam.id : (providerTeams[0]?.id || null);

      // Update Booking status to assigned
      await db.booking.update({
        where: { id: offer.bookingId },
        data: {
          status: "assigned",
          providerTeamId: teamId,
          providerOfferId: offerId
        }
      });

      // If teamId is assigned, auto-block the slot in AvailabilityBlocks
      if (teamId) {
        await db.availabilityBlock.create({
          data: {
            providerTeamId: teamId,
            startsAt: offer.booking.scheduledAt,
            endsAt: new Date(offer.booking.scheduledAt.getTime() + 4 * 60 * 60 * 1000), // 4h duration block
            reason: "capacity",
            autoBlocked: true,
            bookingId: offer.bookingId
          }
        });
      }
    } else {
      // If declined, update booking status back to offer_exhausted or similar (or draft) if no other pending offer
      // Let's set status to confirmed (needs manual dispatch) so ops handles re-routing
      await db.booking.update({
        where: { id: offer.bookingId },
        data: { status: "confirmed" }
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Manage Document Simulation
export async function uploadProviderDocument(payload: {
  companyId: string;
  docType: string;
  fileUrl: string;
  expiresAtStr?: string;
}) {
  try {
    const { companyId, docType, fileUrl, expiresAtStr } = payload;

    const document = await db.providerDocument.create({
      data: {
        providerId: companyId,
        docType,
        fileUrl,
        expiresAt: expiresAtStr ? new Date(expiresAtStr) : null,
        verified: true, // auto-verified for simulated flow
        verifiedAt: new Date()
      }
    });

    return { success: true, document };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Stripe Connect status toggle simulation
export async function toggleStripeConnectSimulation(companyId: string) {
  try {
    const provider = await db.provider.findUnique({
      where: { id: companyId }
    });

    if (!provider) {
      throw new Error("Provider not found");
    }

    const nextStatus = provider.stripeConnectStatus === "active" ? "pending" : "active";

    await db.provider.update({
      where: { id: companyId },
      data: {
        stripeConnectStatus: nextStatus,
        stripeConnectAccountId: nextStatus === "active" ? `acct_sim_${Math.random().toString(36).substr(2, 9)}` : null,
        bankDetailsVerified: nextStatus === "active"
      }
    });

    return { success: true, stripeStatus: nextStatus };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Manage Listings
export async function updateProviderListing(payload: {
  listingId: string;
  active: boolean;
  serviceRadiusKm: number;
  capacityPerDay: number;
}) {
  try {
    const { listingId, active, serviceRadiusKm, capacityPerDay } = payload;

    const listing = await db.providerListing.update({
      where: { id: listingId },
      data: {
        active,
        serviceRadiusKm: Number(serviceRadiusKm),
        capacityPerDay: Number(capacityPerDay)
      }
    });

    return { success: true, listing };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
