import { logoutAdmin } from "@/app/actions/admin";
import { redirect } from "next/navigation";

export async function POST() {
  await logoutAdmin();
  redirect("/admin/login");
}

export async function GET() {
  await logoutAdmin();
  redirect("/admin/login");
}
