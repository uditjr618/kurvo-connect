
-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Generic helper: insert a notification bypassing RLS
CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid, _title text, _body text, _link text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (_user_id, _title, _body, _link);
END;
$$;

-- Orders: notify retailer on new order, notify customer on status change
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

DROP TRIGGER IF EXISTS trg_notify_order_changes ON public.orders;
CREATE TRIGGER trg_notify_order_changes
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_changes();

-- Requirements: notify retailer when status changes (distributor accepts/fulfills)
CREATE OR REPLACE FUNCTION public.notify_requirement_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

DROP TRIGGER IF EXISTS trg_notify_requirement_changes ON public.requirements;
CREATE TRIGGER trg_notify_requirement_changes
AFTER UPDATE ON public.requirements
FOR EACH ROW EXECUTE FUNCTION public.notify_requirement_changes();

-- Bookings: notify customer on status change
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

DROP TRIGGER IF EXISTS trg_notify_booking_changes ON public.bookings;
CREATE TRIGGER trg_notify_booking_changes
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_changes();
