CREATE OR REPLACE FUNCTION public.list_plumbers()
RETURNS TABLE(id uuid, full_name text, address text, avatar_url text, latitude double precision, longitude double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.address, p.avatar_url, p.latitude, p.longitude
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id
  WHERE r.role = 'plumber' AND p.is_active = true;
$$;
REVOKE ALL ON FUNCTION public.list_plumbers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_plumbers() TO authenticated;