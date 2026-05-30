export const COMPANY_CONFIG = {
  // Support overriding via environment variables, or fallback to default values
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "+41 (0) 44 123 4567",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "ops@elite-cleaning.ch",
  
  // WhatsApp digits only for the API link (e.g. 41791234567)
  whatsappNumber: process.env.NEXT_PUBLIC_COMPANY_WHATSAPP || "41791234567",
  
  // WhatsApp user-facing formatted display label
  whatsappLabel: process.env.NEXT_PUBLIC_COMPANY_WHATSAPP_LABEL || "+41 79 123 45 67",
};
