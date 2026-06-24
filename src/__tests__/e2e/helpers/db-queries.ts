import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getOtpForEmail(email: string): Promise<string> {
  const record = await prisma.guestEmail.findUnique({
    where: { email }
  });
  return record?.otpCode || "";
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  });
}

export async function getLatestBookingForEmail(email: string) {
  // Check GuestEmail relation
  const guestBookings = await prisma.booking.findMany({
    where: { guestEmail: email },
    orderBy: { createdAt: "desc" },
    take: 1
  });
  if (guestBookings.length > 0) return guestBookings[0];

  // Or registered User relation
  const user = await getUserByEmail(email);
  if (user) {
    const userBookings = await prisma.booking.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 1
    });
    if (userBookings.length > 0) return userBookings[0];
  }

  return null;
}

export async function getProviderBySlug(slug: string) {
  return prisma.provider.findUnique({
    where: { slug }
  });
}
