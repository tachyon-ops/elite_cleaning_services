"use client";

import React, { useState } from "react";
import { submitContactForm } from "@/app/actions/contact";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

interface ContactFormProps {
  translations: {
    formTitle: string;
    formDesc: string;
    fieldName: string;
    fieldEmail: string;
    fieldPhone: string;
    fieldSubject: string;
    fieldMessage: string;
    btnSubmit: string;
    btnSubmitting: string;
    successMessage: string;
    errorMessage: string;
  };
}

export function ContactForm({ translations }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await submitContactForm({
        name,
        email,
        phone,
        subject,
        message,
      });

      if (res.success) {
        setStatus("success");
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
      } else {
        setStatus("error");
        setErrorMsg(res.error || translations.errorMessage);
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(translations.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-bg-subtle/50 backdrop-blur-md p-8 md:p-10 rounded-lg border border-border/50 shadow-md">
      <div className="mb-8">
        <h3 className="text-body-lg font-display font-bold text-ink uppercase tracking-wider mb-2">
          {translations.formTitle}
        </h3>
        <p className="text-body-sm text-ink-subtle">{translations.formDesc}</p>
      </div>

      {status === "success" && (
        <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-md text-success flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-body-sm font-medium leading-relaxed">
            {translations.successMessage}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-md text-danger flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-body-sm font-medium leading-relaxed">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="contact-name"
              className="text-caption text-ink-muted uppercase tracking-wider font-semibold"
            >
              {translations.fieldName} *
            </label>
            <input
              id="contact-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded border border-border bg-bg text-ink text-body-md focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="contact-email"
              className="text-caption text-ink-muted uppercase tracking-wider font-semibold"
            >
              {translations.fieldEmail} *
            </label>
            <input
              id="contact-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded border border-border bg-bg text-ink text-body-md focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="contact-phone"
              className="text-caption text-ink-muted uppercase tracking-wider font-semibold"
            >
              {translations.fieldPhone}
            </label>
            <input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded border border-border bg-bg text-ink text-body-md focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="contact-subject"
              className="text-caption text-ink-muted uppercase tracking-wider font-semibold"
            >
              {translations.fieldSubject} *
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded border border-border bg-bg text-ink text-body-md focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contact-message"
            className="text-caption text-ink-muted uppercase tracking-wider font-semibold"
          >
            {translations.fieldMessage} *
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded border border-border bg-bg text-ink text-body-md focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-y"
          />
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="squeegee-shine flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-accent hover:bg-accent-hover disabled:bg-ink-subtle text-ink-inverse font-semibold rounded uppercase tracking-wider text-body-sm shadow transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? translations.btnSubmitting : translations.btnSubmit}
          </button>
        </div>
      </form>
    </div>
  );
}
