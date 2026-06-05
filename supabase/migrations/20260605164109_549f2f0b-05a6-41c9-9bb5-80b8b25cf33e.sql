
-- 1) Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT true;

-- 2) WhatsApp logs table
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  phone TEXT,
  title TEXT,
  body TEXT,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.whatsapp_logs TO authenticated;
GRANT ALL ON public.whatsapp_logs TO service_role;

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own whatsapp logs" ON public.whatsapp_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins manage whatsapp logs" ON public.whatsapp_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) pg_net for trigger -> edge function
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 4) Dispatch helper — posts to send-whatsapp edge function
CREATE OR REPLACE FUNCTION public.dispatch_whatsapp(_user_id UUID, _title TEXT, _body TEXT, _link TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fiolyhtznlicdskctkme.supabase.co/functions/v1/send-whatsapp',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpb2x5aHR6bmxpY2Rza2N0a21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDY0OTAsImV4cCI6MjA5NTUyMjQ5MH0.xQmsNJ6Jb6iYgscuUBtyvWKk9-WEQ5-XrgH0KeZ7qd4'
    ),
    body := jsonb_build_object('user_id', _user_id, 'title', _title, 'body', _body, 'link', _link)
  );
EXCEPTION WHEN OTHERS THEN
  -- Never block the main transaction
  RAISE NOTICE 'dispatch_whatsapp failed: %', SQLERRM;
END;
$$;

-- 5) Update notification triggers to ALSO dispatch WhatsApp
CREATE OR REPLACE FUNCTION public.notify_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.retailer_id IS NOT NULL THEN
      PERFORM public.create_notification(
        NEW.retailer_id,
        'New order received',
        'You have a new ' || NEW.delivery_type || ' order worth ₹' || NEW.total,
        '/my-shop'
      );
      PERFORM public.dispatch_whatsapp(
        NEW.retailer_id,
        'New order received',
        'You have a new ' || NEW.delivery_type || ' order worth ₹' || NEW.total,
        '/my-shop'
      );
    END IF;
    PERFORM public.dispatch_whatsapp(
      NEW.customer_id,
      'Order placed',
      'Your order worth ₹' || NEW.total || ' was placed successfully.',
      '/customer-orders'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.customer_id,
      'Order ' || NEW.status,
      'Your order status changed to ' || NEW.status,
      '/customer-orders'
    );
    PERFORM public.dispatch_whatsapp(
      NEW.customer_id,
      'Order ' || NEW.status,
      'Your order status changed to ' || NEW.status,
      '/customer-orders'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.dispatch_whatsapp(
      NEW.customer_id,
      'Booking received',
      'Your ' || NEW.service_type || ' booking is now pending.',
      '/customer-orders'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.customer_id,
      'Booking ' || NEW.status,
      'Your ' || NEW.service_type || ' booking is now ' || NEW.status,
      '/customer-orders'
    );
    PERFORM public.dispatch_whatsapp(
      NEW.customer_id,
      'Booking ' || NEW.status,
      'Your ' || NEW.service_type || ' booking is now ' || NEW.status,
      '/customer-orders'
    );
    IF NEW.plumber_id IS NOT NULL THEN
      PERFORM public.dispatch_whatsapp(
        NEW.plumber_id,
        'Booking ' || NEW.status,
        'The ' || NEW.service_type || ' booking is now ' || NEW.status,
        '/plumber-jobs'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_requirement_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.dispatch_whatsapp(
      NEW.retailer_id,
      'Requirement posted',
      'Your "' || NEW.product_name || '" requirement is now visible to distributors.',
      '/my-shop'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.retailer_id,
      'Requirement ' || NEW.status,
      'Your "' || NEW.product_name || '" requirement is now ' || NEW.status,
      '/my-shop'
    );
    PERFORM public.dispatch_whatsapp(
      NEW.retailer_id,
      'Requirement ' || NEW.status,
      'Your "' || NEW.product_name || '" requirement is now ' || NEW.status,
      '/my-shop'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Welcome on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _wa TEXT;
BEGIN
  _wa := NEW.raw_user_meta_data->>'whatsapp_number';
  INSERT INTO public.profiles (id, full_name, phone, whatsapp_number)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'phone',
          _wa);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'));

  -- Welcome WhatsApp (only if number provided)
  IF _wa IS NOT NULL AND _wa <> '' THEN
    PERFORM public.dispatch_whatsapp(
      NEW.id,
      'Welcome to Kurvo 🎉',
      'Your account has been created successfully. You have 100 reward points to start!',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure triggers exist (they should already, but be safe)
DROP TRIGGER IF EXISTS notify_order_changes_trg ON public.orders;
CREATE TRIGGER notify_order_changes_trg
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_changes();

DROP TRIGGER IF EXISTS notify_booking_changes_trg ON public.bookings;
CREATE TRIGGER notify_booking_changes_trg
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_changes();

DROP TRIGGER IF EXISTS notify_requirement_changes_trg ON public.requirements;
CREATE TRIGGER notify_requirement_changes_trg
  AFTER INSERT OR UPDATE ON public.requirements
  FOR EACH ROW EXECUTE FUNCTION public.notify_requirement_changes();
