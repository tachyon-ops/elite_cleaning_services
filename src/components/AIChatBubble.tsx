"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am the Mondar Assistant, your premium Swiss dispatch concierge. How can I assist you with your specialty cleaning needs today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Rate limit and chat mode states
  const [remainingLimit, setRemainingLimit] = useState<number | null>(null);
  const [maxLimit, setMaxLimit] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState<"ai" | "offline" | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessageId = Math.random().toString();
    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      content: input.trim(),
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
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
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

  return (
    <>
      {/* Floating Bubble Button */}
      <div className="fixed bottom-[88px] right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-accent hover:bg-accent-hover text-ink-inverse h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.4)] hover:scale-105 cursor-pointer relative group"
          title="Mondar Assistant"
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
        <div className="fixed bottom-[148px] right-6 z-50 w-[350px] sm:w-[380px] h-[500px] bg-bg/95 backdrop-blur-md border border-border/80 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-popover-in">
          {/* Header */}
          <div className="bg-ink text-ink-inverse p-4 flex items-center justify-between border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-ink-inverse shadow-sm">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-body-sm font-semibold tracking-wide">Mondar Assistant</span>
                <span className="text-[10px] text-ink-subtle uppercase tracking-wider">Swiss Dispatch Desk</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ink-subtle hover:text-ink-inverse transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      : "bg-bg-subtle border border-border/40 text-ink rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-bg-subtle border border-border/40 text-ink rounded-lg rounded-tl-none p-3 shadow-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-subtle animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-subtle animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-subtle animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Rate Limit Indicator / Mode Badge */}
          {(remainingLimit !== null || chatMode) && (
            <div className="px-4 py-1.5 bg-bg-subtle border-t border-border/30 flex justify-between items-center text-[10px] text-ink-subtle select-none">
              <span>
                {chatMode === "offline" ? (
                  <span className="text-amber-600 dark:text-amber-500 font-medium">Concierge Mode (Offline)</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-500 font-medium">AI Agent Mode (Online)</span>
                )}
              </span>
              {remainingLimit !== null && maxLimit !== null && (
                <span>
                  AI Queries: <strong className="font-semibold">{remainingLimit}</strong>/{maxLimit}
                </span>
              )}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-border/40 p-3 bg-bg flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pricing, bookings, aviation..."
              className="flex-1 bg-bg-subtle border border-border rounded-md px-3.5 py-2 text-body-sm focus:outline-none focus:border-accent text-ink transition-colors"
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
