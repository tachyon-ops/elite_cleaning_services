"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface FloatingWhatsAppButtonProps {
  whatsappNumber: string;
}

export function FloatingWhatsAppButton({ whatsappNumber }: FloatingWhatsAppButtonProps) {
  const pathname = usePathname();

  // Hide on admin dashboard and partner portal routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/partner")) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href={`https://wa.me/${whatsappNumber}?text=Hello%20Mondar%20Concierge,%20I'd%20like%20to%20inquire%20about%20a%20specialty%20clean.`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-ink hover:bg-black text-accent hover:text-accent border border-accent/35 hover:border-accent h-12 w-12 hover:w-[210px] focus:w-[210px] active:w-[210px] rounded-full flex items-center justify-start pl-[13px] transition-all duration-300 shadow-[0_4px_20px_rgba(146,108,21,0.25)] hover:shadow-[0_6px_25px_rgba(146,108,21,0.4)] group overflow-hidden select-none"
      >
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
        </div>
        <span className="max-w-0 opacity-0 ml-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-3 group-focus:max-w-[150px] group-focus:opacity-100 group-focus:ml-3 group-active:max-w-[150px] group-active:opacity-100 group-active:ml-3 transition-all duration-300 ease-out whitespace-nowrap text-caption tracking-wider font-semibold text-ink-inverse">
          CONCIERGE ON-CALL
        </span>
      </a>
    </div>
  );
}
