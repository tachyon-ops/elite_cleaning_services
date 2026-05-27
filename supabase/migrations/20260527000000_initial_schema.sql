-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define custom types/enums
CREATE TYPE public.user_role AS ENUM ('super_admin', 'editor', 'dispatcher', 'registered_customer');
CREATE TYPE public.partner_status AS ENUM ('active', 'paused', 'terminated');
CREATE TYPE public.pricing_model_type AS ENUM ('instant', 'quote_on_request');
CREATE TYPE public.booking_status AS ENUM (
  'draft', 
  'intake_submitted', 
  'quote_pending', 
  'quote_sent', 
  'quote_accepted', 
  'payment_pending', 
  'confirmed', 
  'assigned', 
  'in_progress', 
  'completed', 
  'invoiced', 
  'paid',
  'cancelled_by_customer',
  'cancelled_by_ops'
);
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE public.recurring_frequency AS ENUM ('weekly', 'bi_weekly', 'monthly', 'quarterly');

-- Create updated_at trigger helper function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL, -- Nullable for guests upgrading later
  role public.user_role NOT NULL DEFAULT 'registered_customer',
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  gdpr_marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper security functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'editor', 'dispatcher')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_access ON public.users
  FOR ALL USING (id = auth.uid());

CREATE POLICY users_staff_access ON public.users
  FOR ALL USING (public.is_admin_or_staff());

-- 2. guest_emails table
CREATE TABLE public.guest_emails (
  email VARCHAR(255) PRIMARY KEY,
  otp_code VARCHAR(6) NULL,
  otp_expires_at TIMESTAMPTZ NULL,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_guest_emails_updated_at
  BEFORE UPDATE ON public.guest_emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on guest_emails (Server-side/service role only by default, staff can read)
ALTER TABLE public.guest_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY guest_emails_staff_access ON public.guest_emails
  FOR SELECT USING (public.is_admin_or_staff());

-- 3. partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  vat_number VARCHAR(50) NULL,
  insurance_doc_url TEXT NULL,
  status public.partner_status NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY partners_staff_access ON public.partners
  FOR ALL USING (public.is_admin_or_staff());

-- 4. partner_teams table
CREATE TABLE public.partner_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  working_hours JSONB NOT NULL, -- e.g., {"mon": ["08:00", "18:00"], ...}
  service_categories TEXT[] NOT NULL,
  region VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_partner_teams_updated_at
  BEFORE UPDATE ON public.partner_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_partner_teams_partner_id ON public.partner_teams(partner_id);

ALTER TABLE public.partner_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY partner_teams_staff_access ON public.partner_teams
  FOR ALL USING (public.is_admin_or_staff());

-- 5. service_categories table
CREATE TABLE public.service_categories (
  slug VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  vertical VARCHAR(50) NOT NULL, -- 'aviation', 'yacht', 'commercial', 'hospitality', 'special'
  pricing_model public.pricing_model_type NOT NULL DEFAULT 'instant',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Read is public, write is super_admin only
CREATE POLICY service_categories_public_read ON public.service_categories
  FOR SELECT USING (true);

CREATE POLICY service_categories_admin_all ON public.service_categories
  FOR ALL USING (public.is_admin());

-- 6. service_offerings table
CREATE TABLE public.service_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug VARCHAR(100) NOT NULL REFERENCES public.service_categories(slug) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  base_price_chf DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL, -- 'per_job', 'per_hour', 'per_m2', 'per_foot'
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_service_offerings_updated_at
  BEFORE UPDATE ON public.service_offerings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_service_offerings_category_slug ON public.service_offerings(category_slug);

ALTER TABLE public.service_offerings ENABLE ROW LEVEL SECURITY;

-- Read is public, write is super_admin only
CREATE POLICY service_offerings_public_read ON public.service_offerings
  FOR SELECT USING (true);

CREATE POLICY service_offerings_admin_all ON public.service_offerings
  FOR ALL USING (public.is_admin());

-- 7. bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  guest_email VARCHAR(255) NULL REFERENCES public.guest_emails(email) ON DELETE SET NULL,
  vertical VARCHAR(50) NOT NULL,
  category_slug VARCHAR(100) NULL REFERENCES public.service_categories(slug) ON DELETE SET NULL,
  intake JSONB NOT NULL, -- stores vertical-specific intake questionnaire
  scheduled_at TIMESTAMPTZ NOT NULL,
  scheduled_window VARCHAR(50) NOT NULL,
  location_address TEXT NOT NULL,
  location_geo POINT NULL,
  partner_team_id UUID NULL REFERENCES public.partner_teams(id) ON DELETE SET NULL,
  status public.booking_status NOT NULL DEFAULT 'draft',
  total_amount_chf DECIMAL(10, 2) NOT NULL,
  deposit_amount_chf DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NULL,
  stripe_subscription_id VARCHAR(255) NULL,
  is_first_booking BOOLEAN NOT NULL DEFAULT TRUE,
  cancellation_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX idx_bookings_guest_email ON public.bookings(guest_email);
CREATE INDEX idx_bookings_partner_team_id ON public.bookings(partner_team_id);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customers can view/update their own bookings. Guests can view if their session correlates (handled in server client).
CREATE POLICY bookings_customer_read_write ON public.bookings
  FOR ALL USING (customer_id = auth.uid());

-- Staff has complete access
CREATE POLICY bookings_staff_all ON public.bookings
  FOR ALL USING (public.is_admin_or_staff());

-- Allow anyone to create a booking (needed for guest/initial booking flows)
CREATE POLICY bookings_anonymous_insert ON public.bookings
  FOR INSERT WITH CHECK (true);

-- 8. quotes table
CREATE TABLE public.quotes (
  booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  ops_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  amount_chf DECIMAL(10, 2) NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ NULL,
  accepted_at TIMESTAMPTZ NULL,
  rejected_at TIMESTAMPTZ NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Customers can read quotes linked to their bookings
CREATE POLICY quotes_customer_read ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = quotes.booking_id AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY quotes_staff_all ON public.quotes
  FOR ALL USING (public.is_admin_or_staff());

-- 9. payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_charge_id VARCHAR(255) NOT NULL,
  amount_chf DECIMAL(10, 2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  refunded_amount_chf DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Customers can read their own payments
CREATE POLICY payments_customer_read ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY payments_staff_all ON public.payments
  FOR ALL USING (public.is_admin_or_staff());

-- 10. recurring_schedules table
CREATE TABLE public.recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_slug VARCHAR(100) NOT NULL REFERENCES public.service_categories(slug) ON DELETE CASCADE,
  frequency public.recurring_frequency NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_window VARCHAR(50) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  next_run_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_recurring_schedules_updated_at
  BEFORE UPDATE ON public.recurring_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_recurring_schedules_customer_id ON public.recurring_schedules(customer_id);

ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY recurring_schedules_customer_all ON public.recurring_schedules
  FOR ALL USING (customer_id = auth.uid());

CREATE POLICY recurring_schedules_staff_all ON public.recurring_schedules
  FOR ALL USING (public.is_admin_or_staff());

-- 11. availability_blocks table
CREATE TABLE public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_team_id UUID NOT NULL REFERENCES public.partner_teams(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason VARCHAR(100) NOT NULL DEFAULT 'capacity',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_availability_blocks_updated_at
  BEFORE UPDATE ON public.availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_availability_blocks_team_id ON public.availability_blocks(partner_team_id);

ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

-- Read is public (needed to check slots on frontend), write is staff only
CREATE POLICY availability_blocks_read ON public.availability_blocks
  FOR SELECT USING (true);

CREATE POLICY availability_blocks_staff_all ON public.availability_blocks
  FOR ALL USING (public.is_admin_or_staff());

-- 12. reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NULL,
  public BOOLEAN NOT NULL DEFAULT FALSE,
  customer_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_reviews_booking_id ON public.reviews(booking_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Read is public if marked public, otherwise staff or owner can read.
CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT USING (public = true OR customer_id = auth.uid() OR public.is_admin_or_staff());

CREATE POLICY reviews_customer_insert ON public.reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY reviews_staff_all ON public.reviews
  FOR ALL USING (public.is_admin_or_staff());

-- 13. audit_log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  target_table VARCHAR(100) NOT NULL,
  target_id UUID NOT NULL,
  before JSONB NULL,
  after JSONB NULL,
  ip_address VARCHAR(50) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GDPR Audit compliance: strict read access
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_admin_read ON public.audit_log
  FOR SELECT USING (public.is_admin());

-- 14. consent_log table
CREATE TABLE public.consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  consent_type VARCHAR(50) NOT NULL, -- 'marketing', 'cookies_analytics', etc.
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ NULL,
  ip_address VARCHAR(50) NULL
);

-- GDPR Consent log
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_log_user_access ON public.consent_log
  FOR SELECT USING (user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE id = auth.uid()));

CREATE POLICY consent_log_admin_all ON public.consent_log
  FOR ALL USING (public.is_admin());

-- Enable index-based query performance enhancements on common targets
CREATE INDEX idx_audit_log_target ON public.audit_log(target_table, target_id);
CREATE INDEX idx_consent_log_email ON public.consent_log(email);
