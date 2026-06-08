
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.list_plumbers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_plumbers() TO authenticated, service_role;
