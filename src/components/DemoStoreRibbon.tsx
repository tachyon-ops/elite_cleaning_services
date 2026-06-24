"use client";

import React from "react";

export function DemoStoreRibbon() {
  return (
    <div className="fixed top-0 right-0 z-[100] w-32 h-32 md:w-40 md:h-40 overflow-hidden pointer-events-none select-none">
      {/* 
        This is a premium diagonal corner ribbon.
        It uses pointer-events-none so users can click right through it to access buttons underneath (like the Get Quote CTA).
      */}
      <div 
        className="absolute top-[38px] -right-[30px] md:top-[50px] md:-right-[34px] w-[160px] md:w-[192px] py-1 md:py-1.5 bg-[linear-gradient(135deg,#b58920_0%,#fde047_40%,#fef08a_50%,#fde047_60%,#9a7012_100%)] shadow-[0_4px_12px_rgba(0,0,0,0.2)] border-y border-white/30 rotate-45 text-center text-[10px] md:text-[11px] font-black tracking-[0.22em] text-[#0f172a] uppercase pointer-events-none ribbon-shine"
        style={{
          textShadow: "0 1px 1px rgba(255,255,255,0.4)"
        }}
      >
        Demo Store
      </div>
    </div>
  );
}
