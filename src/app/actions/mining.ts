"use server";

import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/app/actions/admin";
import { searchShabPublications, fetchAndParseShabPublication } from "@/lib/mining/shab-client";
import { classifyLead } from "@/lib/mining/lead-classifier";
import { geocodeSwissAddress } from "@/lib/mining/geo-enricher";

export interface GetMiningLeadsFilter {
  canton?: string;
  status?: string;
  subRubric?: string;
  detectedVertical?: string;
  search?: string;
  minScore?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Query mining leads with faceted filtering and aggregate KPIs
 */
export async function getMiningLeads(filters: GetMiningLeadsFilter = {}) {
  try {
    if (!(await isAdminAuthenticated())) {
      return { success: false, error: "Unauthorized" };
    }

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(10, filters.pageSize || 25));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filters.canton && filters.canton !== "all") {
      where.canton = filters.canton.toUpperCase();
    }

    if (filters.status && filters.status !== "all") {
      where.status = filters.status;
    }

    if (filters.subRubric && filters.subRubric !== "all") {
      where.subRubric = filters.subRubric;
    }

    if (filters.detectedVertical && filters.detectedVertical !== "all") {
      where.detectedVertical = filters.detectedVertical;
    }

    if (typeof filters.minScore === "number" && filters.minScore > 0) {
      where.priorityScore = { gte: filters.minScore };
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { companyName: { contains: q } },
        { uid: { contains: q } },
        { newSeat: { contains: q } },
        { newAddress: { contains: q } },
        { purpose: { contains: q } },
      ];
    }

    const [total, leads, statsTotal, statsMovers, statsIncorp, statsContacted, statsWon] =
      await Promise.all([
        db.miningLead.count({ where }),
        db.miningLead.findMany({
          where,
          orderBy: [{ publicationDate: "desc" }, { priorityScore: "desc" }],
          skip,
          take: pageSize,
        }),
        db.miningLead.count(),
        db.miningLead.count({ where: { subRubric: "HR02" } }),
        db.miningLead.count({ where: { subRubric: "HR01" } }),
        db.miningLead.count({ where: { status: { in: ["contacted", "qualified", "quoted"] } } }),
        db.miningLead.count({ where: { status: "won" } }),
      ]);

    const stats = {
      totalAllTime: statsTotal,
      totalMovers: statsMovers,
      totalIncorporations: statsIncorp,
      inOutreach: statsContacted,
      totalWon: statsWon,
      conversionRate:
        statsTotal > 0 ? ((statsWon / statsTotal) * 100).toFixed(1) + "%" : "0.0%",
    };

    return {
      success: true,
      leads: JSON.parse(JSON.stringify(leads)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats,
    };
  } catch (error: any) {
    console.error("[getMiningLeads error]:", error);
    return { success: false, error: error.message || "Failed to load mining leads" };
  }
}

export interface UpdateMiningLeadInput {
  status?: string;
  notes?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactPerson?: string;
  website?: string;
}

/**
 * Update CRM pipeline status, outreach notes, and direct contact details for a mined lead
 */
export async function updateMiningLead(leadId: string, input: UpdateMiningLeadInput) {
  try {
    if (!(await isAdminAuthenticated())) {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.status) {
      updateData.status = input.status;
      if (["contacted", "qualified", "quoted", "won"].includes(input.status)) {
        updateData.contactedAt = new Date();
      }
    }

    if (input.notes !== undefined) updateData.contactNotes = input.notes;
    if (input.contactPhone !== undefined) updateData.contactPhone = input.contactPhone;
    if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail;
    if (input.contactPerson !== undefined) updateData.contactPerson = input.contactPerson;
    if (input.website !== undefined) updateData.website = input.website;

    const updated = await db.miningLead.update({
      where: { id: leadId },
      data: updateData,
    });

    return { success: true, lead: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("[updateMiningLead error]:", error);
    return { success: false, error: error.message || "Failed to update lead" };
  }
}

/**
 * Update CRM pipeline status and outreach notes (wrapper for backwards compatibility)
 */
export async function updateMiningLeadStatus(leadId: string, status: string, notes?: string) {
  return updateMiningLead(leadId, { status, notes });
}

/**
 * Convert a mined lead into a pre-filled Draft Booking for Commercial/Moveout Cleaning
 */
export async function convertLeadToDraftBooking(leadId: string) {
  try {
    if (!(await isAdminAuthenticated())) {
      return { success: false, error: "Unauthorized" };
    }

    const lead = await db.miningLead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    const targetVertical = lead.detectedVertical === "hospitality" ? "hospitality" : "commercial";
    const address = lead.newAddress || lead.newSeat || `${lead.canton}, Switzerland`;

    const intakePayload = {
      companyName: lead.companyName,
      uid: lead.uid,
      source: "commercial_mining",
      publicationId: lead.publicationId,
      subRubric: lead.subRubric,
      oldAddress: lead.oldAddress,
      purpose: lead.purpose,
      contactNotes: lead.contactNotes,
      initialNotes: `Lead mined from SHAB commercial register (${lead.changeType || "relocation"}). Old address: ${lead.oldAddress || "N/A"}`,
    };

    // Create a quote-pending draft booking
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 14); // default 2 weeks out

    const booking = await db.booking.create({
      data: {
        vertical: targetVertical,
        status: "quote_pending",
        locationAddress: address,
        scheduledAt: scheduledDate,
        scheduledWindow: "09:00 - 17:00",
        intake: JSON.stringify(intakePayload),
        totalAmountChf: 0,
        depositAmountChf: 0,
      },
    });

    // Update the lead status
    await db.miningLead.update({
      where: { id: leadId },
      data: {
        status: "quoted",
        convertedBookingId: booking.id,
        contactedAt: new Date(),
      },
    });

    return {
      success: true,
      bookingId: booking.id,
      message: "Lead successfully converted to commercial booking draft",
    };
  } catch (error: any) {
    console.error("[convertLeadToDraftBooking error]:", error);
    return { success: false, error: error.message || "Failed to convert lead" };
  }
}

/**
 * Run synchronization pull from SHAB API
 */
export async function triggerMiningSync(options: {
  cantons?: string[];
  daysBack?: number;
  subRubrics?: string[];
  maxPublications?: number;
} = {}) {
  try {
    if (!(await isAdminAuthenticated())) {
      return { success: false, error: "Unauthorized" };
    }

    const cantons = options.cantons && options.cantons.length > 0 ? options.cantons : ["ZH", "ZG", "BE", "LU"];
    const subRubrics = options.subRubrics || ["HR02", "HR01"];
    const daysBack = Math.max(1, Math.min(30, options.daysBack || 3));
    const maxPublications = options.maxPublications || 60;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const { ids } = await searchShabPublications({
      startDate: startStr,
      endDate: endStr,
      cantons,
      subRubrics,
      size: Math.min(200, maxPublications * 2),
    });

    if (!ids || ids.length === 0) {
      return {
        success: true,
        processed: 0,
        added: 0,
        skipped: 0,
        message: `No new publications found between ${startStr} and ${endStr} for cantons: ${cantons.join(", ")}`,
      };
    }

    // Limit to maxPublications to avoid rate limits
    const targetIds = ids.slice(0, maxPublications);

    // Filter out already existing IDs in parallel
    const existing = await db.miningLead.findMany({
      where: { publicationId: { in: targetIds } },
      select: { publicationId: true },
    });
    const existingSet = new Set(existing.map((e) => e.publicationId));

    const toProcess = targetIds.filter((id) => !existingSet.has(id));
    let addedCount = 0;
    let skippedCount = targetIds.length - toProcess.length;

    for (const pubId of toProcess) {
      try {
        const candidate = await fetchAndParseShabPublication(pubId);
        if (!candidate) {
          skippedCount++;
          continue;
        }

        // Classify & score the lead
        const classification = classifyLead({
          companyName: candidate.companyName,
          purpose: candidate.purpose,
          legalForm: candidate.legalForm,
          changeType: candidate.changeType,
          hasOldAddress: Boolean(candidate.oldAddress),
          subRubric: candidate.subRubric,
          canton: candidate.canton,
        });

        // Geocode coordinates if new address is available
        let geoLat: number | null = null;
        let geoLon: number | null = null;
        if (candidate.newAddress) {
          const geo = await geocodeSwissAddress(`${candidate.newAddress}, Switzerland`);
          if (geo) {
            geoLat = geo.latitude;
            geoLon = geo.longitude;
          }
        }

        await db.miningLead.create({
          data: {
            source: "shab",
            subRubric: candidate.subRubric,
            publicationId: candidate.publicationId,
            publicationDate: candidate.publicationDate,
            canton: candidate.canton,
            uid: candidate.uid,
            companyName: candidate.companyName,
            legalForm: candidate.legalForm,
            changeType: candidate.changeType,
            newSeat: candidate.newSeat || null,
            newAddress: candidate.newAddress || null,
            oldAddress: candidate.oldAddress || null,
            purpose: candidate.purpose || null,
            detectedVertical: classification.detectedVertical,
            priorityScore: classification.priorityScore,
            confidence: classification.confidence,
            status: "new",
            sourceUrl: candidate.sourceUrl,
            geoLatitude: geoLat,
            geoLongitude: geoLon,
          },
        });

        addedCount++;
        // Polite spacing (150ms delay)
        await new Promise((r) => setTimeout(r, 150));
      } catch (err) {
        console.warn(`[Mining Sync] Error processing publication ${pubId}:`, err);
        skippedCount++;
      }
    }

    return {
      success: true,
      processed: targetIds.length,
      added: addedCount,
      skipped: skippedCount,
      message: `Sync complete: ${addedCount} new commercial leads added, ${skippedCount} skipped.`,
    };
  } catch (error: any) {
    console.error("[triggerMiningSync error]:", error);
    return { success: false, error: error.message || "Failed to sync commercial leads" };
  }
}

/**
 * Export filtered leads as a CSV string
 */
export async function exportMiningLeadsCsv(filters: GetMiningLeadsFilter = {}) {
  try {
    if (!(await isAdminAuthenticated())) {
      return { success: false, error: "Unauthorized" };
    }

    const where: any = {};
    if (filters.canton && filters.canton !== "all") where.canton = filters.canton.toUpperCase();
    if (filters.status && filters.status !== "all") where.status = filters.status;
    if (filters.subRubric && filters.subRubric !== "all") where.subRubric = filters.subRubric;

    const leads = await db.miningLead.findMany({
      where,
      orderBy: { publicationDate: "desc" },
      take: 1000,
    });

    const headers = [
      "ID",
      "Publication Date",
      "Canton",
      "UID",
      "Company Name",
      "Legal Form",
      "SubRubric",
      "Change Type",
      "New Address",
      "New Seat",
      "Old Address",
      "Phone",
      "Email",
      "Contact Person",
      "Website",
      "Priority Score",
      "Vertical",
      "Status",
      "Contact Notes",
      "Source URL",
    ];

    const rows = leads.map((l) => [
      l.id,
      l.publicationDate.toISOString().split("T")[0],
      l.canton,
      `"${(l.uid || "").replace(/"/g, '""')}"`,
      `"${(l.companyName || "").replace(/"/g, '""')}"`,
      `"${(l.legalForm || "").replace(/"/g, '""')}"`,
      l.subRubric || "",
      l.changeType || "",
      `"${(l.newAddress || "").replace(/"/g, '""')}"`,
      `"${(l.newSeat || "").replace(/"/g, '""')}"`,
      `"${(l.oldAddress || "").replace(/"/g, '""')}"`,
      `"${(l.contactPhone || "").replace(/"/g, '""')}"`,
      `"${(l.contactEmail || "").replace(/"/g, '""')}"`,
      `"${(l.contactPerson || "").replace(/"/g, '""')}"`,
      `"${(l.website || "").replace(/"/g, '""')}"`,
      l.priorityScore,
      l.detectedVertical,
      l.status,
      `"${(l.contactNotes || "").replace(/"/g, '""')}"`,
      l.sourceUrl || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return { success: true, csv: csvContent };
  } catch (error: any) {
    console.error("[exportMiningLeadsCsv error]:", error);
    return { success: false, error: error.message || "Failed to export CSV" };
  }
}
