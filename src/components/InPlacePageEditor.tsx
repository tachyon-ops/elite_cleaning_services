"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { updatePageTranslation, getPageTranslationAction } from "@/app/actions/page-translations";
import { Globe, Pencil, Save, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface InPlacePageEditorProps {
  pageKey: string;
  initialLocale: string;
  initialSlug: string;
  initialTitle: string;
  initialContent: string;
}

const LOCALES = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "rm", label: "Rumantsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

export function InPlacePageEditor({
  pageKey,
  initialLocale,
  initialSlug,
  initialTitle,
  initialContent,
}: InPlacePageEditorProps) {
  const router = useRouter();
  
  let langContext;
  try {
    langContext = useLanguage();
  } catch {
    // context not available
  }

  const t = (key: string): string => {
    if (langContext?.t) {
      return langContext.t(key);
    }
    const fallbacks: Record<string, string> = {
      "admin.editPage": "Edit Page"
    };
    return fallbacks[key] || key;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialLocale);
  
  // Fields for the active tab translation
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [content, setContent] = useState(initialContent);
  
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch translation when changing locale tab
  const handleTabChange = async (localeCode: string) => {
    setActiveTab(localeCode);
    setStatusMsg(null);
    
    // If it's the initial locale, use the original server values
    if (localeCode === initialLocale) {
      setTitle(initialTitle);
      setSlug(initialSlug);
      setContent(initialContent);
      return;
    }

    try {
      const res = await getPageTranslationAction(pageKey, localeCode);
      if (res.success && res.translation) {
        setTitle(res.translation.title);
        setSlug(res.translation.slug);
        setContent(res.translation.content);
      } else {
        // No translation found yet for this locale: pre-populate with default slugs but empty content
        setTitle("");
        setContent("");
        
        // Simple default slug suggestion based on key
        let defaultSlug = `${pageKey}`;
        if (pageKey === "privacy") {
          const suggestions: Record<string, string> = {
            de: "rechtliches/datenschutz",
            en: "legal/privacy",
            fr: "juridique/confidentialite",
            it: "legale/privacy",
            rm: "legal/datas",
            es: "legal/privacidad",
            pt: "legal/privacidade"
          };
          defaultSlug = suggestions[localeCode] || "legal/privacy";
        } else if (pageKey === "terms") {
          const suggestions: Record<string, string> = {
            de: "rechtliches/agb",
            en: "legal/terms",
            fr: "juridique/conditions-generales",
            it: "legale/termini",
            rm: "legal/cundizions",
            es: "legal/condiciones",
            pt: "legal/termos"
          };
          defaultSlug = suggestions[localeCode] || "legal/terms";
        } else if (pageKey === "cookies") {
          const suggestions: Record<string, string> = {
            de: "rechtliches/cookies",
            en: "legal/cookies",
            fr: "juridique/cookies",
            it: "legale/cookie",
            rm: "legal/cookies",
            es: "legal/cookies",
            pt: "legal/cookies"
          };
          defaultSlug = suggestions[localeCode] || "legal/cookies";
        }
        setSlug(defaultSlug);
      }
    } catch {
      setTitle("");
      setSlug(`legal/${pageKey}`);
      setContent("");
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setStatusMsg({ type: "error", text: "Title is required." });
      return;
    }
    if (!slug.trim()) {
      setStatusMsg({ type: "error", text: "Slug URL path is required." });
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await updatePageTranslation({
        pageKey,
        locale: activeTab,
        slug,
        title,
        content,
      });

      if (res.success) {
        setStatusMsg({ type: "success", text: "Translation saved successfully!" });
        // If we updated the current active locale, refresh to show the changes
        if (activeTab === initialLocale) {
          router.refresh();
        }
      } else {
        setStatusMsg({ type: "error", text: res.error || "Failed to save translation." });
      }
    });
  };

  if (!isEditing) {
    return (
      <div className="fixed bottom-24 right-6 z-[110]">
        <button
          onClick={() => setIsEditing(true)}
          className="bg-accent hover:bg-accent-hover text-ink-inverse flex items-center gap-2 px-5 py-3 rounded-full shadow-[0_4px_20px_rgba(181,148,16,0.35)] hover:shadow-[0_6px_25px_rgba(181,148,16,0.5)] transition-all font-semibold tracking-wide text-body-sm cursor-pointer select-none"
        >
          <Pencil className="w-4 h-4" /> {t("admin.editPage")}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#080808]/90 backdrop-blur-md flex justify-center items-center p-4 md:p-8 overflow-y-auto animate-popover-in">
      <div className="bg-[#141414] border border-[#262626] rounded-lg max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-body-md font-bold tracking-wide text-[#f2f2f2] uppercase">
                Translate Page In-Place
              </h2>
              <p className="text-caption text-ink-subtle">
                Key Identifier: <code className="text-accent font-mono text-xs">{pageKey}</code>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setStatusMsg(null);
              // reset back to initial
              handleTabChange(initialLocale);
            }}
            className="text-ink-subtle hover:text-[#f2f2f2] p-1.5 rounded-full hover:bg-[#1f1f1f] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Locale tabs */}
        <div className="flex border-b border-[#262626] bg-[#0c0c0c] overflow-x-auto">
          {LOCALES.map((loc) => {
            const isActive = activeTab === loc.code;
            return (
              <button
                key={loc.code}
                type="button"
                onClick={() => handleTabChange(loc.code)}
                className={`px-5 py-3.5 text-body-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-accent text-accent bg-[#141414]"
                    : "border-transparent text-ink-subtle hover:text-[#f2f2f2] hover:bg-[#1f1f1f]/20"
                }`}
              >
                {loc.label} ({loc.code})
              </button>
            );
          })}
        </div>

        {/* Content fields */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {statusMsg && (
            <div
              className={`p-4 rounded border flex items-start gap-3 ${
                statusMsg.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-body-sm font-medium">{statusMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-ink-subtle uppercase tracking-wider font-semibold mb-2">
                Page Title ({activeTab.toUpperCase()})
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Privacy Policy"
                className="w-full bg-[#0c0c0c] border border-[#262626] rounded px-4 py-2.5 text-[#f2f2f2] text-body-sm focus:outline-none focus:border-accent/50 transition-colors font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ink-subtle uppercase tracking-wider font-semibold mb-2">
                URL Slug Path ({activeTab.toUpperCase()})
              </label>
              <div className="flex items-center bg-[#0c0c0c] border border-[#262626] rounded px-4 py-2.5 focus-within:border-accent/50 transition-colors">
                <span className="text-ink-subtle text-body-sm font-mono select-none pr-1">
                  {`/${activeTab}/`}
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. legal/privacy"
                  className="w-full bg-transparent border-none text-[#f2f2f2] text-body-sm focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-ink-subtle uppercase tracking-wider font-semibold mb-2">
              Page Markdown Content ({activeTab.toUpperCase()})
            </label>
            <textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Heading 1&#10;&#10;Write markdown text here..."
              className="w-full bg-[#0c0c0c] border border-[#262626] rounded p-4 text-[#f2f2f2] text-body-sm focus:outline-none focus:border-accent/50 transition-colors font-mono resize-y"
            />
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-6 border-t border-[#262626] flex items-center justify-between bg-[#0c0c0c] rounded-b-lg">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setStatusMsg(null);
            }}
            className="border border-[#262626] hover:bg-[#1f1f1f] text-[#f2f2f2] px-5 py-2.5 rounded text-body-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-ink-inverse px-6 py-2.5 rounded text-body-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md select-none"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Translation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
