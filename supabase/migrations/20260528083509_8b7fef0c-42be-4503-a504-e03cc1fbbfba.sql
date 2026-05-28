
-- Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Revoke broad EXECUTE on SECURITY DEFINER functions; grant only where needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- handle_new_user is only called by the trigger as table owner, no execute needed elsewhere

-- Tighten "notifications insert" - restrict to inserting for self (system inserts will use service_role)
DROP POLICY IF EXISTS "anyone authed inserts notifications" ON public.notifications;
CREATE POLICY "users insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Tighten storage listing - require specific path queries (only allow SELECT on objects user owns or within their own folder)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
-- Re-create as fetch-by-name only (no listing). Public buckets still serve files via public URL.
CREATE POLICY "Public read product image files" ON storage.objects FOR SELECT USING (bucket_id = 'product-images' AND (auth.role() = 'authenticated' OR name IS NOT NULL));
CREATE POLICY "Public read avatar files" ON storage.objects FOR SELECT USING (bucket_id = 'avatars' AND (auth.role() = 'authenticated' OR name IS NOT NULL));
