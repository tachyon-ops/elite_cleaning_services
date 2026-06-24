import { BrowserContext } from "@playwright/test";
import { getUserByEmail, getProviderBySlug } from "./db-queries";

export async function loginAsAdmin(context: BrowserContext) {
  const adminUser = await getUserByEmail("admin@elite-cleaning.ch");
  if (!adminUser) {
    throw new Error("Admin user not found in database");
  }

  await context.addCookies([
    {
      name: "admin_session",
      value: "true",
      domain: "localhost",
      path: "/",
    },
    {
      name: "admin_user_id",
      value: adminUser.id,
      domain: "localhost",
      path: "/",
    },
    {
      name: "admin_user_role",
      value: adminUser.role,
      domain: "localhost",
      path: "/",
    },
  ]);
}

export async function loginAsProvider(context: BrowserContext) {
  const provider = await getProviderBySlug("alpine-cleaning-services");
  if (!provider) {
    throw new Error("Provider not found in database");
  }

  await context.addCookies([
    {
      name: "provider_session",
      value: "true",
      domain: "localhost",
      path: "/",
    },
    {
      name: "provider_email",
      value: "partner@alpineclean.ch",
      domain: "localhost",
      path: "/",
    },
    {
      name: "provider_company_id",
      value: provider.id,
      domain: "localhost",
      path: "/",
    },
  ]);
}
