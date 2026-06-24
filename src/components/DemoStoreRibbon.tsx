"use client";

import React from "react";

export function DemoStoreRibbon() {
  return (
    <div className="fixed top-0 right-0 z-[100] w-36 h-36 md:w-44 md:h-44 overflow-hidden pointer-events-none select-none">
      {/* 
        This is a premium diagonal corner ribbon.
        It uses pointer-events-none so users can click right through it to access buttons underneath (like the Get Quote CTA).
      */}
      <div 
        className="absolute top-0 right-0 origin-bottom-right w-max px-6 py-1.5 md:px-8 md:py-2 bg-[linear-gradient(135deg,#b58920_0%,#fde047_40%,#fef08a_50%,#fde047_60%,#9a7012_100%)] shadow-[0_4px_12px_rgba(0,0,0,0.25)] border-y border-white/30 text-center text-[10px] md:text-[12px] font-black tracking-[0.22em] text-[#0f172a] uppercase pointer-events-none ribbon-shine"
        style={{
          transform: "translateY(-100%) rotate(90deg) translateX(70.71067811865476%) rotate(-45deg)",
          textShadow: "0 1px 1px rgba(255,255,255,0.4)"
        }}
      >
        Demo Store
      </div>
    </div>
  );
}
