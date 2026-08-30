"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCampaign } from "@/app/actions/marketing";
import QRCode from "qrcode";
import { ChevronLeft, Printer } from "lucide-react";

export default function AdminPamphletRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/pamphlet/${id}`);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-800 rounded-full" />
    </div>
  );
}
