-- ============================================================
-- BusFee Tracker — V2 Schema
-- Run this in the Supabase SQL Editor.
-- WARNING: Drops all existing tables and data.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PART 1: DROP EVERYTHING (reverse FK order)
-- ────────────────────────────────────────────────────────────
drop table if exists fee_transactions         cascade;
drop table if exists student_monthly_fees     cascade;
drop table if exists student_fee_assignments  cascade;
drop table if exists fee_payments             cascade;
drop table if exists class_accounts           cascade;
drop table if exists coordinator_accounts     cascade;
drop table if exists students                 cascade;
drop table if exists divisions                cascade;
drop table if exists grades                   cascade;
drop table if exists users                    cascade;
drop function if exists update_updated_at_column cascade;


-- ────────────────────────────────────────────────────────────
-- PART 2: CREATE ALL TABLES
-- (no RLS policies here — they are added in Part 3 after all
--  tables exist, so forward-references do not fail)
-- ────────────────────────────────────────────────────────────

-- 1. USERS
--    id = Supabase Auth UUID directly (no separate auth_id column)
create table users (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('ADMIN', 'CLASS', 'COORDINATOR', 'STUDENT')),
    name text not null,
    created_at timestamptz default now()
);
-- 2. GRADES
create table grades (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    created_at timestamptz default now()
);
-- 3. DIVISIONS
create table divisions (
    id uuid primary key default gen_random_uuid(),
    grade_id uuid not null references grades(id) on delete cascade,
    name text not null,
    created_at timestamptz default now(),

    unique(grade_id, name)
);
-- 4. CLASS_ACCOUNTS (one per division)
create table class_accounts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references users(id) on delete cascade,

    grade_id uuid not null references grades(id),

    division_id uuid not null references divisions(id),

    created_at timestamptz default now(),

    unique(grade_id, division_id)
);

-- 5. COORDINATOR_ACCOUNTS (one per grade, read-only role)
create table coordinator_accounts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references users(id) on delete cascade,

    grade_id uuid not null references grades(id),

    created_at timestamptz default now(),

    unique(grade_id)
);

-- 6. STUDENTS
create table students (
    id           uuid primary key default gen_random_uuid(),
    admission_no text        not null unique,
    name         text        not null,
    grade_id     uuid        not null references grades(id),
    division_id  uuid        not null references divisions(id),
    monthly_fee  numeric     not null default 0,
    user_id      uuid        references users(id),
    created_at   timestamptz not null default now()
);

-- 7. STUDENT_MONTHLY_FEES
create table student_monthly_fees (
    id          uuid primary key default gen_random_uuid(),
    student_id  uuid        not null references students(id) on delete cascade,
    month       integer     not null check (month between 1 and 12),
    year        integer     not null check (year >= 2020),
    fee         numeric     not null default 0,
    paid_amount numeric     not null default 0,
    status      text        not null default 'Pending'
                    check (status in ('Pending', 'Partial', 'Paid', 'Excluded')),
    excluded    boolean     not null default false,
    reason      text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (student_id, month, year)
);

-- 8. FEE_TRANSACTIONS
create table fee_transactions (
    id                   uuid primary key default gen_random_uuid(),
    student_month_fee_id uuid        not null references student_monthly_fees(id) on delete cascade,
    amount               numeric     not null check (amount > 0),
    payment_date         date        not null default current_date,
    collected_by         uuid        references users(id),
    remarks              text,
    created_at           timestamptz not null default now()
);


-- -- ────────────────────────────────────────────────────────────
-- -- PART 3: INDEXES
-- -- ────────────────────────────────────────────────────────────
-- create index idx_divisions_grade_id            on divisions(grade_id);
-- create index idx_class_accounts_user_id        on class_accounts(user_id);
-- create index idx_class_accounts_grade_id       on class_accounts(grade_id);
-- create index idx_class_accounts_division_id    on class_accounts(division_id);
-- create index idx_coordinator_accounts_user_id  on coordinator_accounts(user_id);
-- create index idx_coordinator_accounts_grade_id on coordinator_accounts(grade_id);
-- create index idx_students_grade_id             on students(grade_id);
-- create index idx_students_division_id          on students(division_id);
-- create index idx_students_user_id              on students(user_id);
-- create index idx_smf_student_id                on student_monthly_fees(student_id);
-- create index idx_smf_status                    on student_monthly_fees(status);
-- create index idx_smf_month_year                on student_monthly_fees(month, year);
-- create index idx_ft_smf_id                     on fee_transactions(student_month_fee_id);
-- create index idx_ft_collected_by               on fee_transactions(collected_by);


-- -- ────────────────────────────────────────────────────────────
-- -- PART 4: ROW LEVEL SECURITY
-- -- All tables exist at this point so cross-table policy
-- -- references (e.g. class_accounts → coordinator_accounts)
-- -- will not fail.
-- -- ────────────────────────────────────────────────────────────

-- -- ── users ──
-- alter table users enable row level security;

-- create policy "users: read own"
--     on users for select
--     using (auth.uid() = id);

-- create policy "users: admin all"
--     on users for all
--     using (exists (
--         select 1 from users u where u.id = auth.uid() and u.role = 'ADMIN'
--     ));

-- -- ── grades ──
-- alter table grades enable row level security;

-- create policy "grades: authenticated read"
--     on grades for select
--     using (auth.role() = 'authenticated');

-- -- ── divisions ──
-- alter table divisions enable row level security;

-- create policy "divisions: authenticated read"
--     on divisions for select
--     using (auth.role() = 'authenticated');

-- -- ── class_accounts ──
-- alter table class_accounts enable row level security;

-- create policy "class_accounts: admin all"
--     on class_accounts for all
--     using (exists (
--         select 1 from users where id = auth.uid() and role = 'ADMIN'
--     ));

-- create policy "class_accounts: class read own"
--     on class_accounts for select
--     using (user_id = auth.uid());

-- -- coordinator_accounts exists now, so this forward reference is safe
-- create policy "class_accounts: coordinator read grade"
--     on class_accounts for select
--     using (exists (
--         select 1 from coordinator_accounts ca
--         where ca.user_id = auth.uid()
--           and ca.grade_id = class_accounts.grade_id
--     ));

-- -- ── coordinator_accounts ──
-- alter table coordinator_accounts enable row level security;

-- create policy "coordinator_accounts: admin all"
--     on coordinator_accounts for all
--     using (exists (
--         select 1 from users where id = auth.uid() and role = 'ADMIN'
--     ));

-- create policy "coordinator_accounts: coordinator read own"
--     on coordinator_accounts for select
--     using (user_id = auth.uid());

-- -- ── students ──
-- alter table students enable row level security;

-- create policy "students: admin all"
--     on students for all
--     using (exists (
--         select 1 from users where id = auth.uid() and role = 'ADMIN'
--     ));

-- create policy "students: class manage own division"
--     on students for all
--     using (exists (
--         select 1 from class_accounts ca
--         where ca.user_id = auth.uid()
--           and ca.division_id = students.division_id
--     ));

-- create policy "students: coordinator read own grade"
--     on students for select
--     using (exists (
--         select 1 from coordinator_accounts ca
--         where ca.user_id = auth.uid()
--           and ca.grade_id = students.grade_id
--     ));

-- create policy "students: student read own"
--     on students for select
--     using (user_id = auth.uid());

-- -- ── student_monthly_fees ──
-- alter table student_monthly_fees enable row level security;

-- create policy "smf: admin all"
--     on student_monthly_fees for all
--     using (exists (
--         select 1 from users where id = auth.uid() and role = 'ADMIN'
--     ));

-- create policy "smf: class manage own students"
--     on student_monthly_fees for all
--     using (exists (
--         select 1
--         from class_accounts ca
--         join students s on s.division_id = ca.division_id
--         where ca.user_id = auth.uid()
--           and s.id = student_monthly_fees.student_id
--     ));

-- create policy "smf: coordinator read own grade"
--     on student_monthly_fees for select
--     using (exists (
--         select 1
--         from coordinator_accounts ca
--         join students s on s.grade_id = ca.grade_id
--         where ca.user_id = auth.uid()
--           and s.id = student_monthly_fees.student_id
--     ));

-- create policy "smf: student read own"
--     on student_monthly_fees for select
--     using (exists (
--         select 1 from students s
--         where s.id = student_monthly_fees.student_id
--           and s.user_id = auth.uid()
--     ));

-- -- ── fee_transactions ──
-- alter table fee_transactions enable row level security;

-- create policy "fee_transactions: admin all"
--     on fee_transactions for all
--     using (exists (
--         select 1 from users where id = auth.uid() and role = 'ADMIN'
--     ));

-- create policy "fee_transactions: class manage"
--     on fee_transactions for all
--     using (exists (
--         select 1
--         from student_monthly_fees smf
--         join students s on s.id = smf.student_id
--         join class_accounts ca on ca.division_id = s.division_id
--         where ca.user_id = auth.uid()
--           and smf.id = fee_transactions.student_month_fee_id
--     ));

-- create policy "fee_transactions: coordinator read"
--     on fee_transactions for select
--     using (exists (
--         select 1
--         from student_monthly_fees smf
--         join students s on s.id = smf.student_id
--         join coordinator_accounts ca on ca.grade_id = s.grade_id
--         where ca.user_id = auth.uid()
--           and smf.id = fee_transactions.student_month_fee_id
--     ));

-- create policy "fee_transactions: student read own"
--     on fee_transactions for select
--     using (exists (
--         select 1
--         from student_monthly_fees smf
--         join students s on s.id = smf.student_id
--         where s.user_id = auth.uid()
--           and smf.id = fee_transactions.student_month_fee_id
--     ));


-- -- ────────────────────────────────────────────────────────────
-- -- PART 5: TRIGGER — auto-update updated_at
-- -- ────────────────────────────────────────────────────────────
-- create function update_updated_at_column()
-- returns trigger language plpgsql as $$
-- begin
--     new.updated_at = now();
--     return new;
-- end;
-- $$;

-- create trigger set_smf_updated_at
--     before update on student_monthly_fees
--     for each row execute function update_updated_at_column();
