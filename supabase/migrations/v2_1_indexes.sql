-- ============================================================
-- BusFee Tracker — V2 Indexes (additive, safe to run on existing data)
-- No table is dropped or altered destructively. Safe to re-run.
-- ============================================================

create index if not exists idx_divisions_grade_id            on divisions(grade_id);
create index if not exists idx_class_accounts_user_id        on class_accounts(user_id);
create index if not exists idx_class_accounts_grade_id       on class_accounts(grade_id);
create index if not exists idx_class_accounts_division_id    on class_accounts(division_id);
create index if not exists idx_coordinator_accounts_user_id  on coordinator_accounts(user_id);
create index if not exists idx_coordinator_accounts_grade_id on coordinator_accounts(grade_id);
create index if not exists idx_students_grade_id             on students(grade_id);
create index if not exists idx_students_division_id          on students(division_id);
create index if not exists idx_students_user_id              on students(user_id);
create index if not exists idx_smf_student_id                on student_monthly_fees(student_id);
create index if not exists idx_smf_status                    on student_monthly_fees(status);
create index if not exists idx_smf_month_year                on student_monthly_fees(month, year);
-- Defaulters/report queries filter on (month, year, status) together on every load —
-- a composite index serves that predicate directly instead of two separate scans.
create index if not exists idx_smf_month_year_status         on student_monthly_fees(month, year, status);
create index if not exists idx_ft_smf_id                      on fee_transactions(student_month_fee_id);
create index if not exists idx_ft_collected_by                on fee_transactions(collected_by);
