"use client";

import React from "react";

export function DemoStoreRibbon() {
  return (
    <div className="fixed top-0 right-0 z-[100] w-28 h-28 md:w-36 md:h-36 overflow-hidden pointer-events-none select-none">
      {/* 
        This is a premium diagonal corner ribbon.
        It uses pointer-events-none so users can click right through it to access buttons underneath (like the Get Quote CTA).
      */}
      <div 
        className="absolute top-5 -right-9 md:top-7 md:-right-10 w-36 md:w-48 py-1 md:py-1.5 bg-gradient-to-r from-[#c5a028] via-[#f3d97a] to-[#a3831b] shadow-[0_3px_10px_rgba(0,0,0,0.15)] border-y border-white/20 rotate-45 text-center text-[9px] md:text-[10px] font-bold tracking-[0.18em] text-[#0f172a] uppercase pointer-events-none logo-shine"
        style={{
          textShadow: "0 1px 1px rgba(255,255,255,0.4)"
        }}
      >
        Demo Store
      </div>
    </div>
  );
}
