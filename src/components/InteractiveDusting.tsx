"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeHref } from "@/lib/i18n";
import { Check, ArrowLeft } from "lucide-react";

interface Particle {
  id: number;
  x: number; // percentage from left
  y: number; // percentage from top
  size: number;
  driftX: number;
  driftY: number;
  color: string;
  swept: boolean;
}

export function InteractiveDusting() {
  const router = useRouter();
  
  // Safe language parsing in case it's rendered outside LanguageProvider context
  let langContext;
  try {
    langContext = useLanguage();
  } catch {
    // context not available
  }

  const locale = langContext?.locale || "de";
  
  // Local translation fallback to ensure page never breaks
  const t = (key: string): string => {
    if (langContext?.t) {
      return langContext.t(key);
    }
    
    // In-memory fallback
    const fallbacks: Record<string, Record<string, string>> = {
      en: {
        "error404.title": "A Corner in Need of Dusting",
        "error404.subtitle": "You ended up in a corner that needs dusting.",
        "error404.description": "It seems this page has gathered a bit of dust, or never existed in the first place. Let our specialists clear the path for you.",
        "error404.button": "Return to safety",
        "error404.dusting": "Sweep the dust to reveal the way back..."
      },
      de: {
        "error404.title": "Eine staubige Ecke",
        "error404.subtitle": "Sie sind in einer Ecke gelandet, die Staub wischen benötigt.",
        "error404.description": "Es scheint, als hätte diese Seite etwas Staub angesetzt oder hat nie existiert. Lassen Sie unsere Spezialisten diesen Pfad für Sie säubern.",
        "error404.button": "Zurück zur Startseite",
        "error404.dusting": "Wischen Sie den Staub weg, um den Rückweg freizugeben..."
      }
    };
    const lang = locale === "de" ? "de" : "en";
    return fallbacks[lang]?.[key] || key;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isSpotless, setIsSpotless] = useState(false);

  // Initialize particles on mount to avoid hydration mismatch
  useEffect(() => {
    const colors = [
      "rgba(146, 108, 21, 0.4)", // light gold
      "rgba(146, 108, 21, 0.6)", // medium gold
      "rgba(71, 85, 105, 0.3)",   // ink-muted / slate
      "rgba(148, 163, 184, 0.4)",  // slate-400
    ];

    const initialParticles: Particle[] = Array.from({ length: 35 }).map((_, i) => {
      const angle = Math.random() * 2 * Math.PI;
      const distance = 50 + Math.random() * 100;
      return {
        id: i,
        x: 10 + Math.random() * 80, // percentage x (10% to 90%)
        y: 15 + Math.random() * 70,  // percentage y (15% to 85%)
        size: 3 + Math.random() * 6, // size in px
        driftX: Math.cos(angle) * distance,
        driftY: Math.sin(angle) * distance,
        color: colors[Math.floor(Math.random() * colors.length)],
        swept: false,
      };
    });

    setParticles(initialParticles);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isSpotless) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;
    setMousePos({ x: mX, y: mY });

    // Brush radius: 55px
    const brushRadius = 55;
    let anyChange = false;

    const updatedParticles = particles.map((p) => {
      if (p.swept) return p;

      // Convert particle percentages to absolute px
      const pxX = (p.x / 100) * rect.width;
      const pxY = (p.y / 100) * rect.height;

      const dx = mX - pxX;
      const dy = mY - pxY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < brushRadius) {
        anyChange = true;
        return { ...p, swept: true };
      }
      return p;
    });

    if (anyChange) {
      setParticles(updatedParticles);
      
      // Check if all particles are swept
      const activeParticles = updatedParticles.filter((p) => !p.swept);
      if (activeParticles.length === 0) {
        setIsSpotless(true);
      }
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: -100, y: -100 });
  };

  const resetDust = () => {
    setIsSpotless(false);
    setParticles((prev) =>
      prev.map((p) => ({
        ...p,
        swept: false,
      }))
    );
  };

  const homeHref = localizeHref("/", locale);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
      {/* Interactive Dusting Box */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full h-72 border border-border/80 bg-bg-subtle relative overflow-hidden rounded-sm select-none cursor-none flex items-center justify-center transition-all duration-300 shadow-sm"
      >
        {/* Helper Instructions inside the box */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center transition-opacity duration-500">
          {isSpotless ? (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div className="h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center border border-accent/20">
                <Check className="w-5 h-5" />
              </div>
              <p className="text-body-sm font-semibold tracking-wider text-accent uppercase font-body">
                Spotless
              </p>
              <p className="text-body-xs text-ink-muted">
                The path is clear.
              </p>
            </div>
          ) : (
            <p className="text-body-xs font-body text-ink-subtle uppercase tracking-widest max-w-xs leading-relaxed">
              {t("error404.dusting")}
            </p>
          )}
        </div>

        {/* Particles */}
        {particles.map((p) => {
          const style: React.CSSProperties = p.swept
            ? {
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                transform: `translate(${p.driftX}px, ${p.driftY}px) scale(0.2)`,
                opacity: 0,
              }
            : {
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                transform: "translate(0px, 0px) scale(1)",
                opacity: 1,
              };

          return (
            <div
              key={p.id}
              className="absolute rounded-full pointer-events-none transition-all duration-1000 ease-out"
              style={style}
            />
          );
        })}

        {/* Custom Brush Cursor Follower */}
        {isHovered && !isSpotless && (
          <div
            className="absolute pointer-events-none rounded-full border border-accent/40 bg-accent/5 -translate-x-1/2 -translate-y-1/2 transition-[width,height] duration-200"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: "48px",
              height: "48px",
            }}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-10 w-full px-4">
        <Link
          href={homeHref}
          className={`w-full sm:w-auto px-8 py-3.5 text-center text-body-sm font-semibold uppercase tracking-wider rounded-sm transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${
            isSpotless
              ? "bg-accent hover:bg-accent-hover text-ink-inverse scale-105 border border-accent"
              : "bg-ink hover:bg-accent hover:border-accent text-ink-inverse border border-ink"
          }`}
        >
          {t("error404.button")}
        </Link>
        
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-8 py-3.5 text-center text-body-sm font-semibold uppercase tracking-wider text-ink border border-border hover:bg-bg-subtle rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>

      {/* Secret clean triggers */}
      {isSpotless && (
        <button
          onClick={resetDust}
          className="text-[10px] text-ink-subtle uppercase tracking-widest hover:text-accent transition-colors mt-6 underline underline-offset-4"
        >
          Make it dusty again
        </button>
      )}
    </div>
  );
}
