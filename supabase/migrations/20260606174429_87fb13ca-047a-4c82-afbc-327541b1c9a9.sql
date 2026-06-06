
-- Drop dispatch helper and logs table
DROP TABLE IF EXISTS public.whatsapp_logs CASCADE;
DROP FUNCTION IF EXISTS public.dispatch_whatsapp(uuid, text, text, text) CASCADE;

-- Remove WhatsApp profile columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS whatsapp_number;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS whatsapp_opt_in;

-- Recreate trigger functions without WhatsApp dispatch
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.customer_id,
      'Booking ' || NEW.status,
      'Your ' || NEW.service_type || ' booking is now ' || NEW.status,
      '/customer-orders'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_order_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.retailer_id IS NOT NULL THEN
      PERFORM public.create_notification(
        NEW.retailer_id,
        'New order received',
        'You have a new ' || NEW.delivery_type || ' order worth ₹' || NEW.total,
        '/my-shop'
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.customer_id,
      'Order ' || NEW.status,
      'Your order status changed to ' || NEW.status,
      '/customer-orders'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_requirement_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.retailer_id,
      'Requirement ' || NEW.status,
      'Your "' || NEW.product_name || '" requirement is now ' || NEW.status,
      '/my-shop'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate list_plumbers without whatsapp_number column
DROP FUNCTION IF EXISTS public.list_plumbers();
CREATE OR REPLACE FUNCTION public.list_plumbers()
RETURNS TABLE(id uuid, full_name text, address text, avatar_url text, latitude double precision, longitude double precision, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.full_name, p.address, p.avatar_url,
         p.latitude, p.longitude, p.phone
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id
  WHERE r.role = 'plumber' AND p.is_active = true;
$$;
