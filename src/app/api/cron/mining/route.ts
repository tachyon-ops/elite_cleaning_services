import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchShabPublications, fetchAndParseShabPublication } from "@/lib/mining/shab-client";
import { classifyLead } from "@/lib/mining/lead-classifier";
import { geocodeSwissAddress } from "@/lib/mining/geo-enricher";

/**
 * Scheduled Cron Ingest Endpoint
 * Can be triggered daily via Vercel Cron, external cron, or GitHub Actions.
 *
 * Headers:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Optional verification if CRON_SECRET is configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const cantons = ["ZH", "BE", "ZG", "LU", "AG", "BS"];
    const subRubrics = ["HR02", "HR01"];

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 2); // Pull last 2 days

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const { ids } = await searchShabPublications({
      startDate: startStr,
      endDate: endStr,
      cantons,
      subRubrics,
      size: 150,
    });

    if (!ids || ids.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new publications found",
        processed: 0,
        added: 0,
      });
    }

    // Check existing
    const existing = await db.miningLead.findMany({
      where: { publicationId: { in: ids } },
      select: { publicationId: true },
    });
    const existingSet = new Set(existing.map((e) => e.publicationId));

    const toProcess = ids.filter((id) => !existingSet.has(id)).slice(0, 50);
    let addedCount = 0;

    for (const pubId of toProcess) {
      try {
        const candidate = await fetchAndParseShabPublication(pubId);
        if (!candidate) continue;

        const classification = classifyLead({
          companyName: candidate.companyName,
          purpose: candidate.purpose,
          legalForm: candidate.legalForm,
          changeType: candidate.changeType,
          hasOldAddress: Boolean(candidate.oldAddress),
          subRubric: candidate.subRubric,
          canton: candidate.canton,
        });

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
        await new Promise((r) => setTimeout(r, 150));
      } catch (e) {
        console.warn(`[Cron Mining] Failed for ${pubId}`, e);
      }
    }

    return NextResponse.json({
      success: true,
      processed: toProcess.length,
      added: addedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron Mining error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
