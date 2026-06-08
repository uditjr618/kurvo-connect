
-- ============ PROFILES: tighten SELECT ============
DROP POLICY IF EXISTS "profiles readable by all authed" ON public.profiles;

CREATE POLICY "users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Safe public lookup: name + avatar only
CREATE OR REPLACE FUNCTION public.get_profile_basics(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_ids);
$$;
REVOKE EXECUTE ON FUNCTION public.get_profile_basics(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_basics(uuid[]) TO authenticated, service_role;

-- Public retailer directory (business address & coords ok; no phone)
CREATE OR REPLACE FUNCTION public.list_retailers()
RETURNS TABLE(id uuid, full_name text, address text, avatar_url text,
              latitude double precision, longitude double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.address, p.avatar_url, p.latitude, p.longitude
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id
  WHERE r.role = 'retailer' AND p.is_active = true;
$$;
REVOKE EXECUTE ON FUNCTION public.list_retailers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_retailers() TO authenticated, service_role;

-- Tighten existing list_plumbers (drop phone exposure)
DROP FUNCTION IF EXISTS public.list_plumbers();
CREATE OR REPLACE FUNCTION public.list_plumbers()
RETURNS TABLE(id uuid, full_name text, address text, avatar_url text,
              latitude double precision, longitude double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.address, p.avatar_url, p.latitude, p.longitude
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id
  WHERE r.role = 'plumber' AND p.is_active = true;
$$;
REVOKE EXECUTE ON FUNCTION public.list_plumbers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_plumbers() TO authenticated, service_role;

-- ============ NOTIFICATIONS: remove user-insert ============
DROP POLICY IF EXISTS "users insert own notifications" ON public.notifications;

CREATE OR REPLACE FUNCTION public.notify_self(_title text, _body text DEFAULT NULL, _link text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF length(coalesce(_title,'')) = 0 OR length(_title) > 200 THEN
    RAISE EXCEPTION 'Invalid title';
  END IF;
  IF _body IS NOT NULL AND length(_body) > 1000 THEN
    RAISE EXCEPTION 'Body too long';
  END IF;
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (auth.uid(), _title, _body, _link);
END$$;
REVOKE EXECUTE ON FUNCTION public.notify_self(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_self(text, text, text) TO authenticated;

-- ============ REWARD TRANSACTIONS: server-validated ============
DROP POLICY IF EXISTS "users insert own transactions" ON public.reward_transactions;

CREATE OR REPLACE FUNCTION public.earn_points(_action text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _amt int; _desc text; _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  CASE _action
    WHEN 'bill_upload'           THEN _amt := 50;  _desc := 'Bill upload';
    WHEN 'product_code'          THEN _amt := 30;  _desc := 'Product code redeemed';
    WHEN 'qr_scan'               THEN _amt := 40;  _desc := 'QR scan reward';
    WHEN 'plumber_complete' THEN
      IF NOT public.has_role(_uid, 'plumber') THEN RAISE EXCEPTION 'Not a plumber'; END IF;
      _amt := 100; _desc := 'Plumber job completed';
    WHEN 'order_delivered' THEN
      IF NOT public.has_role(_uid, 'retailer') THEN RAISE EXCEPTION 'Not a retailer'; END IF;
      _amt := 50;  _desc := 'Order delivered';
    WHEN 'requirement_fulfilled' THEN
      IF NOT public.has_role(_uid, 'distributor') THEN RAISE EXCEPTION 'Not a distributor'; END IF;
      _amt := 20;  _desc := 'Requirement fulfilled';
    ELSE RAISE EXCEPTION 'Unknown action %', _action;
  END CASE;

  UPDATE public.profiles SET points = points + _amt WHERE id = _uid;
  INSERT INTO public.reward_transactions(user_id, type, amount, description)
  VALUES (_uid, 'earn', _amt, _desc);
  RETURN _amt;
END$$;
REVOKE EXECUTE ON FUNCTION public.earn_points(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.earn_points(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_reward(_reward_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cost int; _title text; _pts int; _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT points_cost, title INTO _cost, _title
  FROM public.rewards WHERE id = _reward_id AND is_active;
  IF _cost IS NULL THEN RAISE EXCEPTION 'Reward not available'; END IF;
  SELECT points INTO _pts FROM public.profiles WHERE id = _uid;
  IF coalesce(_pts,0) < _cost THEN RAISE EXCEPTION 'Insufficient points'; END IF;
  UPDATE public.profiles SET points = points - _cost WHERE id = _uid;
  INSERT INTO public.reward_transactions(user_id, type, amount, description)
  VALUES (_uid, 'redeem', _cost, 'Redeemed: ' || _title);
END$$;
REVOKE EXECUTE ON FUNCTION public.redeem_reward(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_reward(uuid) TO authenticated;

-- ============ STORAGE: scope uploads ============
DROP POLICY IF EXISTS "Authed upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authed upload product images" ON storage.objects;

CREATE POLICY "Users upload own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Retailers upload own product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'retailer')
);
