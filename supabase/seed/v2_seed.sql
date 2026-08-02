-- ============================================================
-- BusFee Tracker — V2 Seed Data
-- Run AFTER v2_schema.sql.
-- ============================================================
-- BEFORE running this file, create the Auth users in Supabase:
--   Dashboard → Authentication → Users → Add User
--
-- CLASS ACCOUNTS (51):   class.<grade><div>@school.local
--   e.g.  class.8a@school.local, class.10q@school.local
--
-- COORDINATOR ACCOUNTS (3):  coordinator.<grade>@school.local
--   e.g.  coordinator.8@school.local
--
-- Password for all: BusFee@2026
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- STEP 1: Grades
-- ────────────────────────────────────────────────────────────
insert into grades (name) values ('8'), ('9'), ('10');


-- ────────────────────────────────────────────────────────────
-- STEP 2: Divisions (A–Q for each grade)
-- ────────────────────────────────────────────────────────────
do $$
declare
    g   record;
    div text;
begin
    for g in select id from grades loop
        foreach div in array array['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'] loop
            insert into divisions (grade_id, name) values (g.id, div);
        end loop;
    end loop;
end;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 3: Class account users (id = auth.users.id)
-- ────────────────────────────────────────────────────────────
do $$
declare
    g        record;
    d        record;
    email    text;
    auth_uid uuid;
begin
    for g in select id, name from grades loop
        for d in select id, name from divisions where grade_id = g.id loop

            email := 'class.' || lower(g.name) || lower(d.name) || '@school.local';

            select id into auth_uid from auth.users where auth.users.email = email limit 1;

            if auth_uid is null then
                raise notice 'Auth user not found: %', email;
                continue;
            end if;

            -- V2: users.id = auth.uid()
            insert into users (id, name, role)
            values (auth_uid, 'Class ' || g.name || d.name, 'CLASS')
            on conflict (id) do nothing;

            insert into class_accounts (user_id, grade_id, division_id)
            values (auth_uid, g.id, d.id)
            on conflict (grade_id, division_id) do nothing;

        end loop;
    end loop;
end;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 4: Coordinator account users
-- ────────────────────────────────────────────────────────────
do $$
declare
    g        record;
    email    text;
    auth_uid uuid;
begin
    for g in select id, name from grades loop

        email := 'coordinator.' || g.name || '@school.local';

        select id into auth_uid from auth.users where auth.users.email = email limit 1;

        if auth_uid is null then
            raise notice 'Auth user not found: %', email;
            continue;
        end if;

        insert into users (id, name, role)
        values (auth_uid, 'Grade ' || g.name || ' Coordinator', 'COORDINATOR')
        on conflict (id) do nothing;

        insert into coordinator_accounts (user_id, grade_id)
        values (auth_uid, g.id)
        on conflict (grade_id) do nothing;

    end loop;
end;
$$;


-- ────────────────────────────────────────────────────────────
-- Verify (run separately after seeding)
-- ────────────────────────────────────────────────────────────
-- select count(*) from grades;             -- 3
-- select count(*) from divisions;          -- 51
-- select count(*) from class_accounts;     -- 51
-- select count(*) from coordinator_accounts; -- 3
