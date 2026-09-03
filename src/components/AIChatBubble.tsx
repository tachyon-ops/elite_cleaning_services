"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, X, Send, Sparkles, Bot, RotateCcw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Grüezi! I am the Mondar AI Concierge (powered by Nuncio from ZPI).\n\nI can calculate instant verified quotes for move-out cleans with 100% Handover Guarantee, regular housekeeping, commercial offices, or bespoke aviation/yacht detailing.\n\nHow can I help you today?",
};

const CHAT_STORAGE_KEY = "nuncio_chat_history";
const CHAT_OPEN_KEY = "nuncio_chat_open";

function formatSubInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Parse inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);
  return codeParts.map((codePart, cIdx) => {
    const codeMatch = codePart.match(/^`([^`]+)`$/);
    if (codeMatch) {
      return (
        <code key={`${keyPrefix}-c-${cIdx}`} className="px-1.5 py-0.5 bg-[#262626] text-accent rounded text-[11px] font-mono">
          {codeMatch[1]}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${cIdx}`}>{codePart}</React.Fragment>;
  });
}

function formatInlineText(text: string, keyPrefix: string = ""): React.ReactNode[] {
  // Parse bold: **text**
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return boldParts.map((boldPart, bIdx) => {
    const boldMatch = boldPart.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={`${keyPrefix}-b-${bIdx}`} className="font-semibold text-white">
          {formatSubInline(boldMatch[1], `${keyPrefix}-b-${bIdx}`)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-r-${bIdx}`}>{formatSubInline(boldPart, `${keyPrefix}-r-${bIdx}`)}</React.Fragment>;
  });
}

// Helper to render markdown links and formatting inside chat messages
function renderFormattedContent(text: string) {
  if (!text) return null;

  // Split by markdown link pattern [Label](href)
  const linkParts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return linkParts.map((part, index) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      return (
        <span key={`link-${index}`} className="block my-2">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-ink-inverse rounded font-semibold text-xs hover:bg-accent-hover transition-colors shadow-xs cursor-pointer"
          >
            <span>{label}</span>
            <span className="text-[11px]">→</span>
          </Link>
        </span>
      );
    }

    return (
      <span key={`text-${index}`}>
        {formatInlineText(part, `p-${index}`)}
      </span>
    );
  });
}

export function AIChatBubble({ hideBranding = false }: { hideBranding?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Rate limit and chat mode states
  const [remainingLimit, setRemainingLimit] = useState<number | null>(null);
  const [maxLimit, setMaxLimit] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState<"ai" | "offline" | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore chat history and open state from localStorage
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map((m: Message) => {
            if (m.id === "welcome" || (m.content && m.content.includes("powered by Nuncio)"))) {
              return {
                ...m,
                content: m.content.replace(/\(powered by Nuncio\)/g, "(powered by Nuncio from ZPI)"),
              };
            }
            return m;
          });
          setMessages(migrated);
        }
      }
      const savedOpen = sessionStorage.getItem(CHAT_OPEN_KEY);
      if (savedOpen === "true") {
        setIsOpen(true);
      }
    } catch (e) {
      console.error("Failed to restore chat history from localStorage", e);
    }
  }, []);

  // Persist chat messages to localStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (e) {
      console.error("Failed to save chat history to localStorage", e);
    }
  }, [messages]);

  // Persist open/close state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_OPEN_KEY, String(isOpen));
    } catch (e) {
      // Ignore
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load initial limit status on chat window open
  useEffect(() => {
    if (isOpen) {
      fetch("/api/chat")
        .then((res) => {
          const limitHeader = res.headers.get("X-RateLimit-Limit");
          const remainingHeader = res.headers.get("X-RateLimit-Remaining");
          const chatModeHeader = res.headers.get("X-Chat-Mode");

          if (limitHeader) setMaxLimit(parseInt(limitHeader, 10));
          if (remainingHeader) setRemainingLimit(parseInt(remainingHeader, 10));
          if (chatModeHeader) setChatMode(chatModeHeader as "ai" | "offline");
        })
        .catch((err) => console.error("Error loading chat limit status:", err));
    }
  }, [isOpen]);

  const handleResetChat = () => {
    const freshMessages = [DEFAULT_WELCOME_MESSAGE];
    setMessages(freshMessages);
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(freshMessages));
    } catch (e) {
      // Ignore
    }
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isTyping) return;

    const userMessageId = Math.random().toString();
    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      content: queryText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const assistantMessageId = Math.random().toString();
    const assistantMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const limitHeader = response.headers.get("X-RateLimit-Limit");
      const remainingHeader = response.headers.get("X-RateLimit-Remaining");
      const chatModeHeader = response.headers.get("X-Chat-Mode");

      if (limitHeader) setMaxLimit(parseInt(limitHeader, 10));
      if (remainingHeader) setRemainingLimit(parseInt(remainingHeader, 10));
      if (chatModeHeader) setChatMode(chatModeHeader as "ai" | "offline");

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedText }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Sorry, I encountered an error connecting to the dispatch desk. Please try again." }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuery(input);
  };

  const quickPills = [
    "3.5 Zimmer Umzugsreinigung",
    "4.5 Zimmer mit Balkon",
    "Büro & Gewerbe Offerte",
    "Aviation & Yacht Service"
  ];

  return (
    <>
      {/* Floating Bubble Button */}
      <div className="fixed bottom-[88px] right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-accent hover:bg-accent-hover text-ink-inverse h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.4)] hover:scale-105 cursor-pointer relative group"
          title="Mondar AI Concierge • Powered by Nuncio from ZPI"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-accent" />
                </span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="fixed bottom-[148px] right-6 z-50 w-[360px] sm:w-[420px] h-[560px] max-h-[calc(100vh-180px)] bg-[#0d0d0d] border border-[#262626] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-popover-in text-[#f2f2f2]">
          {/* Header */}
          <div className="bg-[#141414] p-4 flex items-center justify-between border-b border-[#262626]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-ink-inverse shadow-sm">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-body-sm font-semibold tracking-wide text-[#f2f2f2]">Mondar Concierge</span>
                  <span className="text-[9px] bg-accent/20 text-accent font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">AI</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {!hideBranding ? (
                    <span
                      className="text-emerald-400 font-medium select-none"
                      title="Nuncio from ZPI Conversational Commerce Engine"
                    >
                      Powered by Nuncio from ZPI
                    </span>
                  ) : (
                    <span className="text-[#a3a3a3]">Mondar Enterprise Concierge</span>
                  )}
                  <span className="text-[#525252]">•</span>
                  <span className="text-[#737373]">EU AI Act Art. 50</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="text-[#737373] hover:text-[#f2f2f2] transition-colors cursor-pointer p-1.5 rounded-md hover:bg-[#262626]"
                title="Neuer Chat / Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#737373] hover:text-[#f2f2f2] transition-colors cursor-pointer p-1.5 rounded-md hover:bg-[#262626]"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-body-sm text-left leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-accent text-ink-inverse rounded-tr-none font-medium"
                      : "bg-[#141414] border border-[#262626] text-[#e5e5e5] rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {renderFormattedContent(msg.content)}
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-[#141414] border border-[#262626] text-[#737373] rounded-lg rounded-tl-none p-3 shadow-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#737373] animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#737373] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#737373] animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Pills */}
          <div className="px-3 py-2 bg-[#0d0d0d] border-t border-[#262626] flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => void sendQuery(pill)}
                disabled={isTyping}
                className="text-[11px] whitespace-nowrap bg-[#141414] hover:bg-[#1f1f1f] text-[#a6a6a6] hover:text-[#f2f2f2] border border-[#262626] rounded-full px-2.5 py-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-[#262626] p-3 bg-[#141414] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for instant quotes in German, English, Portuguese..."
              className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-md px-3.5 py-2 text-body-sm focus:outline-none focus:border-accent text-[#f2f2f2] placeholder:text-[#525252] transition-colors"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="bg-accent hover:bg-accent-hover text-ink-inverse p-2 rounded-md shadow-xs transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
