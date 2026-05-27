import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.serviceCategory.findMany();
    const offerings = await db.serviceOffering.findMany();
    const partners = await db.partner.findMany();
    const users = await db.user.findMany();
    return NextResponse.json({
      categoriesCount: categories.length,
      offeringsCount: offerings.length,
      partnersCount: partners.length,
      usersCount: users.length,
      categories,
      offerings,
      partners,
      users
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
