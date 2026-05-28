
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_order_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_requirement_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_booking_changes() FROM PUBLIC, anon, authenticated;
