-- ============================================================
-- BusFee Tracker — Fix infinite recursion in `users` RLS policies
--
-- CAUSE: "users: admin select/insert/update/delete" (v2_2_rls_policies.sql)
-- each do `exists (select 1 from users u where u.id = auth.uid() and
-- u.role = 'ADMIN')`. That subquery reads the SAME table the policy is
-- attached to, so evaluating the policy triggers the policy again on the
-- subquery's scan — infinite recursion, and every query against `users`
-- (including the profile lookup on login) fails.
--
-- FIX: move the admin check into a SECURITY DEFINER helper function.
-- SECURITY DEFINER makes the function's internal query run as the
-- function's owner rather than the calling user; table owners bypass RLS
-- by default (we never set FORCE ROW LEVEL SECURITY), so the lookup inside
-- is_admin() does not re-trigger the `users` policies — breaking the
-- recursion while still checking the exact same thing (does the caller
-- have a `users` row with role = 'ADMIN'). This is Supabase's documented
-- pattern for self-referencing RLS checks.
--
-- Only the `users` table's admin policies are touched. "users: read own"
-- never referenced `users` recursively and is unchanged. No other table's
-- policies are modified.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
    select exists (
        select 1 from public.users where id = auth.uid() and role = 'ADMIN'
    );
$$;

-- Callable by any logged-in client (the function itself only ever answers
-- "is the CURRENT caller an admin" — auth.uid() — so it can't be used to
-- probe other users' roles).
grant execute on function public.is_admin() to authenticated;

drop policy if exists "users: admin select" on users;
create policy "users: admin select"
    on users for select
    using (public.is_admin());

drop policy if exists "users: admin insert" on users;
create policy "users: admin insert"
    on users for insert
    with check (public.is_admin());

drop policy if exists "users: admin update" on users;
create policy "users: admin update"
    on users for update
    using (public.is_admin());

drop policy if exists "users: admin delete" on users;
create policy "users: admin delete"
    on users for delete
    using (public.is_admin());
