
DROP FUNCTION IF EXISTS public.list_plumbers();

CREATE OR REPLACE FUNCTION public.list_plumbers()
RETURNS TABLE(
  id uuid, full_name text, address text, avatar_url text,
  latitude double precision, longitude double precision,
  phone text, whatsapp_number text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.address, p.avatar_url,
         p.latitude, p.longitude, p.phone, p.whatsapp_number
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id
  WHERE r.role = 'plumber' AND p.is_active = true;
$$;

REVOKE ALL ON FUNCTION public.list_plumbers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_plumbers() TO authenticated;
