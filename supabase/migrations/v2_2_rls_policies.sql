-- ============================================================
-- BusFee Tracker — V2 Row Level Security (additive, safe to run)
--
-- CRITICAL FIX: v2_schema.sql's RLS section (Part 4) was entirely commented
-- out, meaning every table was reachable, unfiltered, by any authenticated
-- (or anon, depending on grants) client holding the public anon key —
-- any student/class/coordinator login could read or write any other
-- student's fee records, other classes' data, etc.
--
-- CORRECTED workflow (2026-08-04): CLASS accounts do fee collection only.
-- Student records (create/edit/delete) are ADMIN-only — CLASS no longer
-- gets write access to `students`. Policies below are written as explicit
-- per-operation grants (select/insert/update/delete) rather than broad
-- `for all`, so each role's actual permissions are visible at a glance.
--
-- This migration does NOT drop or alter any table. `alter table ... enable
-- row level security` is idempotent, and every policy is dropped before
-- being recreated so this file is safe to re-run.
-- ============================================================

-- ── users ──
alter table users enable row level security;

drop policy if exists "users: read own" on users;
create policy "users: read own"
    on users for select
    using (auth.uid() = id);

drop policy if exists "users: admin select" on users;
create policy "users: admin select"
    on users for select
    using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'ADMIN'));

drop policy if exists "users: admin insert" on users;
create policy "users: admin insert"
    on users for insert
    with check (exists (select 1 from users u where u.id = auth.uid() and u.role = 'ADMIN'));

drop policy if exists "users: admin update" on users;
create policy "users: admin update"
    on users for update
    using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'ADMIN'));

drop policy if exists "users: admin delete" on users;
create policy "users: admin delete"
    on users for delete
    using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'ADMIN'));

-- REMOVED (workflow correction): "users: class insert student profile".
-- Student user-profile creation is ADMIN-only now — CLASS no longer
-- creates student records at all, so it has no reason to insert here.
drop policy if exists "users: class insert student profile" on users;
drop policy if exists "users: admin all" on users;

-- ── grades ── (read-only for every role; writes happen only via the
-- service-role create-grade/delete-grade Edge Functions, which bypass RLS)
alter table grades enable row level security;

drop policy if exists "grades: authenticated read" on grades;
create policy "grades: authenticated read"
    on grades for select
    using (auth.role() = 'authenticated');

-- ── divisions ── (same as grades — read-only, writes via Edge Functions)
alter table divisions enable row level security;

drop policy if exists "divisions: authenticated read" on divisions;
create policy "divisions: authenticated read"
    on divisions for select
    using (auth.role() = 'authenticated');

-- ── class_accounts ── (provisioned via the service-role create-grade
-- Edge Function; the anon-key client only ever needs to read)
alter table class_accounts enable row level security;

drop policy if exists "class_accounts: admin select" on class_accounts;
create policy "class_accounts: admin select"
    on class_accounts for select
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "class_accounts: class read own" on class_accounts;
create policy "class_accounts: class read own"
    on class_accounts for select
    using (user_id = auth.uid());

drop policy if exists "class_accounts: coordinator read grade" on class_accounts;
create policy "class_accounts: coordinator read grade"
    on class_accounts for select
    using (exists (
        select 1 from coordinator_accounts ca
        where ca.user_id = auth.uid()
          and ca.grade_id = class_accounts.grade_id
    ));

drop policy if exists "class_accounts: admin all" on class_accounts;

-- ── coordinator_accounts ── (same pattern as class_accounts)
alter table coordinator_accounts enable row level security;

drop policy if exists "coordinator_accounts: admin select" on coordinator_accounts;
create policy "coordinator_accounts: admin select"
    on coordinator_accounts for select
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "coordinator_accounts: coordinator read own" on coordinator_accounts;
create policy "coordinator_accounts: coordinator read own"
    on coordinator_accounts for select
    using (user_id = auth.uid());

drop policy if exists "coordinator_accounts: admin all" on coordinator_accounts;

-- ── students ──
-- ADMIN: select/insert/update/delete (full ownership of student records).
-- CLASS: select only, own division — CLASS no longer creates, edits, or
--   deletes students (workflow correction).
-- COORDINATOR: select only, own grade.
-- STUDENT: select only, own record.
alter table students enable row level security;

drop policy if exists "students: admin select" on students;
create policy "students: admin select"
    on students for select
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "students: admin insert" on students;
create policy "students: admin insert"
    on students for insert
    with check (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "students: admin update" on students;
create policy "students: admin update"
    on students for update
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "students: admin delete" on students;
create policy "students: admin delete"
    on students for delete
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "students: class read own division" on students;
create policy "students: class read own division"
    on students for select
    using (exists (
        select 1 from class_accounts ca
        where ca.user_id = auth.uid()
          and ca.division_id = students.division_id
    ));

drop policy if exists "students: coordinator read own grade" on students;
create policy "students: coordinator read own grade"
    on students for select
    using (exists (
        select 1 from coordinator_accounts ca
        where ca.user_id = auth.uid()
          and ca.grade_id = students.grade_id
    ));

drop policy if exists "students: student read own" on students;
create policy "students: student read own"
    on students for select
    using (user_id = auth.uid());

-- Superseded by the explicit policies above.
drop policy if exists "students: admin all" on students;
drop policy if exists "students: class manage own division" on students;

-- ── student_monthly_fees ──
-- Scoped to exactly what fee collection needs: ADMIN full control; CLASS
-- can read/insert/update rows for its own division's students (collecting
-- a payment either creates or updates a month's row) but cannot delete;
-- COORDINATOR/STUDENT remain read-only.
alter table student_monthly_fees enable row level security;

drop policy if exists "smf: admin select" on student_monthly_fees;
create policy "smf: admin select"
    on student_monthly_fees for select
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "smf: admin insert" on student_monthly_fees;
create policy "smf: admin insert"
    on student_monthly_fees for insert
    with check (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "smf: admin update" on student_monthly_fees;
create policy "smf: admin update"
    on student_monthly_fees for update
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "smf: admin delete" on student_monthly_fees;
create policy "smf: admin delete"
    on student_monthly_fees for delete
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "smf: class read own students" on student_monthly_fees;
create policy "smf: class read own students"
    on student_monthly_fees for select
    using (exists (
        select 1
        from class_accounts ca
        join students s on s.division_id = ca.division_id
        where ca.user_id = auth.uid()
          and s.id = student_monthly_fees.student_id
    ));

drop policy if exists "smf: class insert own students" on student_monthly_fees;
create policy "smf: class insert own students"
    on student_monthly_fees for insert
    with check (exists (
        select 1
        from class_accounts ca
        join students s on s.division_id = ca.division_id
        where ca.user_id = auth.uid()
          and s.id = student_monthly_fees.student_id
    ));

drop policy if exists "smf: class update own students" on student_monthly_fees;
create policy "smf: class update own students"
    on student_monthly_fees for update
    using (exists (
        select 1
        from class_accounts ca
        join students s on s.division_id = ca.division_id
        where ca.user_id = auth.uid()
          and s.id = student_monthly_fees.student_id
    ));
-- No "class delete" policy — deleting a fee-month record is not part of
-- fee collection and is intentionally left ADMIN-only.

drop policy if exists "smf: coordinator read own grade" on student_monthly_fees;
create policy "smf: coordinator read own grade"
    on student_monthly_fees for select
    using (exists (
        select 1
        from coordinator_accounts ca
        join students s on s.grade_id = ca.grade_id
        where ca.user_id = auth.uid()
          and s.id = student_monthly_fees.student_id
    ));

drop policy if exists "smf: student read own" on student_monthly_fees;
create policy "smf: student read own"
    on student_monthly_fees for select
    using (exists (
        select 1 from students s
        where s.id = student_monthly_fees.student_id
          and s.user_id = auth.uid()
    ));

-- Superseded by the explicit policies above.
drop policy if exists "smf: admin all" on student_monthly_fees;
drop policy if exists "smf: class manage own students" on student_monthly_fees;

-- ── fee_transactions ──
-- ADMIN: full control. CLASS: insert + read only — a transaction is a
-- payment receipt; once recorded it must not be editable or deletable by
-- a CLASS account. COORDINATOR/STUDENT remain read-only.
alter table fee_transactions enable row level security;

drop policy if exists "fee_transactions: admin select" on fee_transactions;
create policy "fee_transactions: admin select"
    on fee_transactions for select
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "fee_transactions: admin insert" on fee_transactions;
create policy "fee_transactions: admin insert"
    on fee_transactions for insert
    with check (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "fee_transactions: admin update" on fee_transactions;
create policy "fee_transactions: admin update"
    on fee_transactions for update
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "fee_transactions: admin delete" on fee_transactions;
create policy "fee_transactions: admin delete"
    on fee_transactions for delete
    using (exists (select 1 from users where id = auth.uid() and role = 'ADMIN'));

drop policy if exists "fee_transactions: class read" on fee_transactions;
create policy "fee_transactions: class read"
    on fee_transactions for select
    using (exists (
        select 1
        from student_monthly_fees smf
        join students s on s.id = smf.student_id
        join class_accounts ca on ca.division_id = s.division_id
        where ca.user_id = auth.uid()
          and smf.id = fee_transactions.student_month_fee_id
    ));

drop policy if exists "fee_transactions: class insert" on fee_transactions;
create policy "fee_transactions: class insert"
    on fee_transactions for insert
    with check (exists (
        select 1
        from student_monthly_fees smf
        join students s on s.id = smf.student_id
        join class_accounts ca on ca.division_id = s.division_id
        where ca.user_id = auth.uid()
          and smf.id = fee_transactions.student_month_fee_id
    ));
-- No "class update" / "class delete" policy — historical transactions are
-- immutable from a CLASS account by design.

drop policy if exists "fee_transactions: coordinator read" on fee_transactions;
create policy "fee_transactions: coordinator read"
    on fee_transactions for select
    using (exists (
        select 1
        from student_monthly_fees smf
        join students s on s.id = smf.student_id
        join coordinator_accounts ca on ca.grade_id = s.grade_id
        where ca.user_id = auth.uid()
          and smf.id = fee_transactions.student_month_fee_id
    ));

drop policy if exists "fee_transactions: student read own" on fee_transactions;
create policy "fee_transactions: student read own"
    on fee_transactions for select
    using (exists (
        select 1
        from student_monthly_fees smf
        join students s on s.id = smf.student_id
        where s.user_id = auth.uid()
          and smf.id = fee_transactions.student_month_fee_id
    ));

-- Superseded by the explicit policies above.
drop policy if exists "fee_transactions: class manage" on fee_transactions;
