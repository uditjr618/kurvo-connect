
-- Authenticated app role: full CRUD (RLS still enforced)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reward_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Anonymous browsing of public catalog data
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.rewards TO anon;

-- Service role full access
GRANT ALL ON public.bookings TO service_role;
GRANT ALL ON public.carts TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.complaints TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.requirements TO service_role;
GRANT ALL ON public.reward_transactions TO service_role;
GRANT ALL ON public.rewards TO service_role;
GRANT ALL ON public.user_roles TO service_role;

-- Remove duplicate order-change notification trigger
DROP TRIGGER IF EXISTS notify_order_changes_trg ON public.orders;
